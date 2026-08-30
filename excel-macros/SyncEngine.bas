Option Explicit

Private mIsSyncing As Boolean
Private mLastError As String
Private mSyncScheduled As Boolean
Private Const FIRST_DATA_ROW As Long = 6

Public Function IsSyncing() As Boolean
    IsSyncing = mIsSyncing
End Function

Public Function LastSyncError() As String
    LastSyncError = mLastError
End Function

Public Function IsStudentSheet(ByVal sheetName As String) As Boolean
    IsStudentSheet = (sheetName = StudentSheetName())
End Function

Public Function IsTuitionSheet(ByVal sheetName As String) As Boolean
    IsTuitionSheet = (sheetName = TuitionSheetName())
End Function

Public Sub QueueSync()
    If mIsSyncing Or mSyncScheduled Then Exit Sub
    mSyncScheduled = True
    WriteSyncStatus SyncQueuedMessage()
    Application.OnTime Now + TimeSerial(0, 0, 2), "'" & ThisWorkbook.Name & "'!SyncEngine.RunQueuedSync"
End Sub

Public Sub RunQueuedSync()
    mSyncScheduled = False
    SyncAll
End Sub

Public Sub SyncNow()
    SyncAll
End Sub

Public Sub SyncAll()
    Dim previousEvents As Boolean
    Dim previousUpdates As Boolean
    Dim failureMessage As String
    Dim syncStage As String

    If mIsSyncing Then Exit Sub
    mIsSyncing = True
    previousEvents = Application.EnableEvents
    previousUpdates = Application.ScreenUpdating

    On Error GoTo Failed
    Application.EnableEvents = False
    Application.ScreenUpdating = False

    syncStage = "HOC SINH"
    NormalizeStudents
    syncStage = "HOC PHI"
    NormalizeTuition
    syncStage = "danh sach lop"
    RebuildClassRosters
    syncStage = "BANG DIEM"
    RebuildGrades
    syncStage = "tong hop"
    RefreshTotals
    mLastError = vbNullString
    WriteSyncStatus SyncSuccessMessage()

Finished:
    Application.EnableEvents = previousEvents
    Application.ScreenUpdating = previousUpdates
    mIsSyncing = False
    If Len(failureMessage) > 0 Then
        mLastError = failureMessage
        WriteSyncStatus failureMessage
    End If
    Exit Sub

Failed:
    failureMessage = SyncFailurePrefix() & syncStage & ". " & Err.Source & ": " & Err.Description
    Resume Finished
End Sub

Private Sub NormalizeStudents()
    Dim ws As Worksheet
    Dim lastRow As Long
    Dim footerRow As Long
    Dim rowNumber As Long
    Dim classCode As String
    Dim studentCode As String
    Dim stepName As String

    On Error GoTo Failed

    stepName = "open student sheet"
    Set ws = ThisWorkbook.Worksheets.Item(StudentSheetName())
    stepName = "find student rows"
    lastRow = LastDataRow(ws, 2, FIRST_DATA_ROW)
    footerRow = FindFooterRow(ws)
    stepName = "move total row"
    CopyFooterFormat ws, footerRow, lastRow + 1, 24
    ClearOldFooter ws, footerRow, lastRow + 1, 24
    For rowNumber = FIRST_DATA_ROW To lastRow
        stepName = "process student row " & CStr(rowNumber)
        studentCode = Trim$(CStr(ws.Cells(rowNumber, 2).Value))
        classCode = Trim$(CStr(ws.Cells(rowNumber, 7).Value))
        If Len(studentCode) > 0 Then
            If Len(CStr(ws.Cells(rowNumber, 23).Value)) = 0 Then
                ws.Cells(rowNumber, 23).Value = "EXCEL-" & studentCode & "-" & Format$(rowNumber, "0000")
            End If

            If Len(classCode) > 0 Then
                ws.Cells(rowNumber, 24).Value = classCode & "|" & CStr(Application.WorksheetFunction.CountIf(ws.Range("G" & FIRST_DATA_ROW & ":G" & rowNumber), classCode))
                ws.Cells(rowNumber, 25).Value = studentCode & "|" & classCode
            Else
                ws.Cells(rowNumber, 24).ClearContents
                ws.Cells(rowNumber, 25).ClearContents
            End If

            ws.Cells(rowNumber, 1).Value = Application.WorksheetFunction.CountA(ws.Range("B" & FIRST_DATA_ROW & ":B" & rowNumber))
            ws.Cells(rowNumber, 19).Formula = "=SUMIFS(" & SheetReference(TuitionSheetName()) & "$L:$L," & SheetReference(TuitionSheetName()) & "$C:$C,$W" & rowNumber & ")+$M" & rowNumber
            ws.Cells(rowNumber, 20).Formula = "=SUMIFS(" & SheetReference(TuitionSheetName()) & "$M:$M," & SheetReference(TuitionSheetName()) & "$C:$C,$W" & rowNumber & ")+$N" & rowNumber
            ws.Cells(rowNumber, 21).Formula = "=SUMIFS(" & SheetReference(TuitionSheetName()) & "$M:$M," & SheetReference(TuitionSheetName()) & "$C:$C,$W" & rowNumber & "," & SheetReference(TuitionSheetName()) & "$I:$I,""" & MonthlyTuitionLabel() & """)+SUMIFS($N:$N,$W:$W,$W" & rowNumber & ",$O:$O,""<>" & CourseTuitionLabel() & """)"
            ws.Cells(rowNumber, 22).Formula = "=SUMIFS(" & SheetReference(TuitionSheetName()) & "$M:$M," & SheetReference(TuitionSheetName()) & "$C:$C,$W" & rowNumber & "," & SheetReference(TuitionSheetName()) & "$I:$I,""" & CourseTuitionLabel() & """)+SUMIFS($N:$N,$W:$W,$W" & rowNumber & ",$O:$O,""" & CourseTuitionLabel() & """)"
        End If
    Next rowNumber

    SetFooter ws, lastRow + 1, 24, _
        "=COUNTA(B" & FIRST_DATA_ROW & ":B" & lastRow & ")", _
        "=SUM(S" & FIRST_DATA_ROW & ":S" & lastRow & ")", _
        "=SUM(T" & FIRST_DATA_ROW & ":T" & lastRow & ")", _
        "=SUM(U" & FIRST_DATA_ROW & ":U" & lastRow & ")", _
        "=SUM(V" & FIRST_DATA_ROW & ":V" & lastRow & ")"
    Exit Sub

Failed:
    Err.Raise vbObjectError + 513, "NormalizeStudents/" & stepName, Err.Description
End Sub

Private Sub NormalizeTuition()
    Dim ws As Worksheet
    Dim studentSheet As Worksheet
    Dim lastRow As Long
    Dim footerRow As Long
    Dim rowNumber As Long
    Dim studentRow As Long
    Dim receiptCode As String
    Dim studentCode As String
    Dim classCode As String

    Set ws = ThisWorkbook.Worksheets.Item(TuitionSheetName())
    Set studentSheet = ThisWorkbook.Worksheets.Item(StudentSheetName())
    lastRow = LastDataRow(ws, 2, FIRST_DATA_ROW)
    footerRow = FindFooterRow(ws)
    CopyFooterFormat ws, footerRow, lastRow + 1, 19
    ClearOldFooter ws, footerRow, lastRow + 1, 19

    For rowNumber = FIRST_DATA_ROW To lastRow
        receiptCode = Trim$(CStr(ws.Cells(rowNumber, 2).Value))
        studentCode = Trim$(CStr(ws.Cells(rowNumber, 4).Value))
        classCode = Trim$(CStr(ws.Cells(rowNumber, 6).Value))
        If Len(receiptCode) > 0 Or Len(studentCode) > 0 Or Len(classCode) > 0 Then
            studentRow = FindStudentRow(studentSheet, studentCode, classCode)
            If studentRow > 0 Then
                ws.Cells(rowNumber, 3).Value = studentSheet.Cells(studentRow, 23).Value
                ws.Cells(rowNumber, 5).Value = studentSheet.Cells(studentRow, 3).Value
                If Len(receiptCode) = 0 Then ws.Cells(rowNumber, 2).Value = "PT-" & Format$(rowNumber - FIRST_DATA_ROW + 1, "0000")
            Else
                ws.Cells(rowNumber, 3).ClearContents
                ws.Cells(rowNumber, 5).ClearContents
            End If

            If Len(CStr(ws.Cells(rowNumber, 3).Value)) = 0 Then
                ws.Cells(rowNumber, 14).Value = StudentNotFoundMessage()
            ElseIf Val(ws.Cells(rowNumber, 13).Value) > 0 Then
                ws.Cells(rowNumber, 14).Value = UnderpaidStatus()
            ElseIf Val(ws.Cells(rowNumber, 12).Value) > 0 Then
                ws.Cells(rowNumber, 14).Value = PaidStatus()
            Else
                ws.Cells(rowNumber, 14).Value = UnpaidStatus()
            End If
            If IsEmpty(ws.Cells(rowNumber, 15).Value) Then ws.Cells(rowNumber, 15).Value = Date
        End If
    Next rowNumber

    SetFooter ws, lastRow + 1, 19, vbNullString, _
        "=SUM(L" & FIRST_DATA_ROW & ":L" & lastRow & ")+SUM(" & SheetReference(StudentSheetName()) & "$M:$M)", _
        "=SUM(M" & FIRST_DATA_ROW & ":M" & lastRow & ")+SUM(" & SheetReference(StudentSheetName()) & "$N:$N)", vbNullString, vbNullString
    ws.Cells(lastRow + 2, 1).Value = TuitionTotalNote()
End Sub

Private Sub RebuildClassRosters()
    Dim classSheet As Worksheet
    Dim rowNumber As Long
    Dim lastClassRow As Long
    Dim classCode As String
    Dim detailSheet As Worksheet

    Set classSheet = ThisWorkbook.Worksheets.Item(ClassSheetName())
    lastClassRow = LastDataRow(classSheet, 2, FIRST_DATA_ROW)
    For rowNumber = FIRST_DATA_ROW To lastClassRow
        classCode = Trim$(CStr(classSheet.Cells(rowNumber, 2).Value))
        If Len(classCode) > 0 And WorksheetExists(ClassDetailSheetName(classCode)) Then
            Set detailSheet = ThisWorkbook.Worksheets.Item(ClassDetailSheetName(classCode))
            RebuildOneClass detailSheet, classCode
        End If
    Next rowNumber
End Sub

Private Sub RebuildOneClass(ByVal detailSheet As Worksheet, ByVal classCode As String)
    Dim sourceSheet As Worksheet
    Dim lastSourceRow As Long
    Dim lastDetailRow As Long
    Dim sourceRow As Long
    Dim detailRow As Long
    Dim classCount As Long

    Set sourceSheet = ThisWorkbook.Worksheets.Item(StudentSheetName())
    lastSourceRow = LastDataRow(sourceSheet, 2, FIRST_DATA_ROW)
    lastDetailRow = LastDataRow(detailSheet, 2, 12)
    If lastDetailRow >= 12 Then
        detailSheet.Range("A12:M" & lastDetailRow).ClearContents
        On Error Resume Next
        detailSheet.Range("A12:M" & lastDetailRow).Hyperlinks.Delete
        On Error GoTo 0
    End If

    detailRow = 12
    classCount = 0
    For sourceRow = FIRST_DATA_ROW To lastSourceRow
        If Trim$(CStr(sourceSheet.Cells(sourceRow, 2).Value)) <> vbNullString And Trim$(CStr(sourceSheet.Cells(sourceRow, 7).Value)) = classCode Then
            If detailRow > 12 Then CopyDetailFormat detailSheet, 12, detailRow, 13
            classCount = classCount + 1
            detailSheet.Cells(detailRow, 1).Value = classCount
            detailSheet.Cells(detailRow, 2).Value = sourceSheet.Cells(sourceRow, 2).Value
            detailSheet.Cells(detailRow, 3).Value = sourceSheet.Cells(sourceRow, 3).Value
            detailSheet.Cells(detailRow, 4).Value = sourceSheet.Cells(sourceRow, 8).Value
            detailSheet.Cells(detailRow, 5).Value = sourceSheet.Cells(sourceRow, 9).Value
            detailSheet.Cells(detailRow, 6).Value = sourceSheet.Cells(sourceRow, 10).Value
            detailSheet.Cells(detailRow, 12).Value = sourceSheet.Cells(sourceRow, 11).Value
            detailSheet.Cells(detailRow, 13).Value = sourceSheet.Cells(sourceRow, 23).Value
            detailSheet.Cells(detailRow, 7).Formula = "=SUMIFS(" & SheetReference(TuitionSheetName()) & "$L:$L," & SheetReference(TuitionSheetName()) & "$C:$C,$M" & detailRow & ")+SUMIFS(" & SheetReference(StudentSheetName()) & "$M:$M," & SheetReference(StudentSheetName()) & "$W:$W,$M" & detailRow & ")"
            detailSheet.Cells(detailRow, 8).Formula = "=SUMIFS(" & SheetReference(TuitionSheetName()) & "$M:$M," & SheetReference(TuitionSheetName()) & "$C:$C,$M" & detailRow & ")+SUMIFS(" & SheetReference(StudentSheetName()) & "$N:$N," & SheetReference(StudentSheetName()) & "$W:$W,$M" & detailRow & ")"
            detailSheet.Cells(detailRow, 9).Formula = "=SUMIFS(" & SheetReference(TuitionSheetName()) & "$M:$M," & SheetReference(TuitionSheetName()) & "$C:$C,$M" & detailRow & "," & SheetReference(TuitionSheetName()) & "$I:$I,""" & MonthlyTuitionLabel() & """)+SUMIFS(" & SheetReference(StudentSheetName()) & "$N:$N," & SheetReference(StudentSheetName()) & "$W:$W,$M" & detailRow & "," & SheetReference(StudentSheetName()) & "$O:$O,""<>" & CourseTuitionLabel() & """)"
            detailSheet.Cells(detailRow, 10).Formula = "=SUMIFS(" & SheetReference(TuitionSheetName()) & "$M:$M," & SheetReference(TuitionSheetName()) & "$C:$C,$M" & detailRow & "," & SheetReference(TuitionSheetName()) & "$I:$I,""" & CourseTuitionLabel() & """)+SUMIFS(" & SheetReference(StudentSheetName()) & "$N:$N," & SheetReference(StudentSheetName()) & "$W:$W,$M" & detailRow & "," & SheetReference(StudentSheetName()) & "$O:$O,""" & CourseTuitionLabel() & """)"
            detailSheet.Hyperlinks.Add Anchor:=detailSheet.Cells(detailRow, 11), Address:="", SubAddress:=SheetReference(TuitionSheetName()) & "A1", TextToDisplay:="Hoc phi"
            detailRow = detailRow + 1
        End If
    Next sourceRow
End Sub

Private Sub RebuildGrades()
    Dim gradeSheet As Worksheet
    Dim studentSheet As Worksheet
    Dim lastGradeRow As Long
    Dim lastStudentRow As Long
    Dim sourceRow As Long
    Dim gradeRow As Long
    Dim savedCodes() As String
    Dim savedClasses() As String
    Dim savedListening() As Variant
    Dim savedSpeaking() As Variant
    Dim savedReading() As Variant
    Dim savedWriting() As Variant
    Dim savedMidterm() As Variant
    Dim savedFinalExam() As Variant
    Dim savedAttendance() As Variant
    Dim savedCount As Long
    Dim savedIndex As Long
    Dim matchedSavedGrade As Long

    Set gradeSheet = ThisWorkbook.Worksheets.Item(GradesSheetName())
    Set studentSheet = ThisWorkbook.Worksheets.Item(StudentSheetName())
    lastGradeRow = LastDataRow(gradeSheet, 2, FIRST_DATA_ROW)
    If lastGradeRow >= FIRST_DATA_ROW Then
        ReDim savedCodes(1 To lastGradeRow - FIRST_DATA_ROW + 1)
        ReDim savedClasses(1 To lastGradeRow - FIRST_DATA_ROW + 1)
        ReDim savedListening(1 To lastGradeRow - FIRST_DATA_ROW + 1)
        ReDim savedSpeaking(1 To lastGradeRow - FIRST_DATA_ROW + 1)
        ReDim savedReading(1 To lastGradeRow - FIRST_DATA_ROW + 1)
        ReDim savedWriting(1 To lastGradeRow - FIRST_DATA_ROW + 1)
        ReDim savedMidterm(1 To lastGradeRow - FIRST_DATA_ROW + 1)
        ReDim savedFinalExam(1 To lastGradeRow - FIRST_DATA_ROW + 1)
        ReDim savedAttendance(1 To lastGradeRow - FIRST_DATA_ROW + 1)
    End If
    For gradeRow = FIRST_DATA_ROW To lastGradeRow
        If Trim$(CStr(gradeSheet.Cells(gradeRow, 2).Value)) <> vbNullString Then
            savedCount = savedCount + 1
            savedCodes(savedCount) = Trim$(CStr(gradeSheet.Cells(gradeRow, 2).Value))
            savedClasses(savedCount) = Trim$(CStr(gradeSheet.Cells(gradeRow, 4).Value))
            savedListening(savedCount) = gradeSheet.Cells(gradeRow, 5).Value
            savedSpeaking(savedCount) = gradeSheet.Cells(gradeRow, 6).Value
            savedReading(savedCount) = gradeSheet.Cells(gradeRow, 7).Value
            savedWriting(savedCount) = gradeSheet.Cells(gradeRow, 8).Value
            savedMidterm(savedCount) = gradeSheet.Cells(gradeRow, 9).Value
            savedFinalExam(savedCount) = gradeSheet.Cells(gradeRow, 10).Value
            savedAttendance(savedCount) = gradeSheet.Cells(gradeRow, 11).Value
        End If
    Next gradeRow
    If lastGradeRow >= FIRST_DATA_ROW Then gradeSheet.Range("A" & FIRST_DATA_ROW & ":M" & lastGradeRow).ClearContents

    lastStudentRow = LastDataRow(studentSheet, 2, FIRST_DATA_ROW)
    gradeRow = FIRST_DATA_ROW
    For sourceRow = FIRST_DATA_ROW To lastStudentRow
        If Trim$(CStr(studentSheet.Cells(sourceRow, 2).Value)) <> vbNullString Then
            If gradeRow > FIRST_DATA_ROW Then CopyDetailFormat gradeSheet, FIRST_DATA_ROW, gradeRow, 13
            gradeSheet.Cells(gradeRow, 1).Value = gradeRow - FIRST_DATA_ROW + 1
            gradeSheet.Cells(gradeRow, 2).Value = studentSheet.Cells(sourceRow, 2).Value
            gradeSheet.Cells(gradeRow, 3).Value = studentSheet.Cells(sourceRow, 3).Value
            gradeSheet.Cells(gradeRow, 4).Value = studentSheet.Cells(sourceRow, 7).Value
            matchedSavedGrade = 0
            For savedIndex = 1 To savedCount
                If savedCodes(savedIndex) = Trim$(CStr(gradeSheet.Cells(gradeRow, 2).Value)) And savedClasses(savedIndex) = Trim$(CStr(gradeSheet.Cells(gradeRow, 4).Value)) Then
                    matchedSavedGrade = savedIndex
                    Exit For
                End If
            Next savedIndex
            If matchedSavedGrade > 0 Then
                gradeSheet.Cells(gradeRow, 5).Value = savedListening(matchedSavedGrade)
                gradeSheet.Cells(gradeRow, 6).Value = savedSpeaking(matchedSavedGrade)
                gradeSheet.Cells(gradeRow, 7).Value = savedReading(matchedSavedGrade)
                gradeSheet.Cells(gradeRow, 8).Value = savedWriting(matchedSavedGrade)
                gradeSheet.Cells(gradeRow, 9).Value = savedMidterm(matchedSavedGrade)
                gradeSheet.Cells(gradeRow, 10).Value = savedFinalExam(matchedSavedGrade)
                gradeSheet.Cells(gradeRow, 11).Value = savedAttendance(matchedSavedGrade)
            End If
            gradeSheet.Cells(gradeRow, 12).Formula = "=IF(COUNT(E" & gradeRow & ":K" & gradeRow & ")=0,"""",ROUND((AVERAGE(E" & gradeRow & ":H" & gradeRow & ")*0.4)+(I" & gradeRow & "*0.2)+(J" & gradeRow & "*0.3)+(K" & gradeRow & "*0.1),1))"
            gradeSheet.Cells(gradeRow, 13).Formula = "=IF(L" & gradeRow & "="""","""",IF(L" & gradeRow & ">=8,""" & ExcellentGradeLabel() & """,IF(L" & gradeRow & ">=6.5,""" & GoodGradeLabel() & """,IF(L" & gradeRow & ">=5,""" & AverageGradeLabel() & """,""" & NeedsSupportGradeLabel() & """))))"
            gradeRow = gradeRow + 1
        End If
    Next sourceRow

    SetFooter gradeSheet, gradeRow, 13, vbNullString, vbNullString, vbNullString, vbNullString, "=IFERROR(AVERAGE(L" & FIRST_DATA_ROW & ":L" & gradeRow - 1 & "),0)"
End Sub

Private Sub RefreshTotals()
    On Error Resume Next
    ThisWorkbook.Worksheets.Item(DashboardSheetName()).Calculate
    ThisWorkbook.Worksheets.Item(ClassSheetName()).Calculate
    ThisWorkbook.Worksheets.Item(TuitionSheetName()).Calculate
    ThisWorkbook.Worksheets.Item(StudentSheetName()).Calculate
    On Error GoTo 0
    Application.Calculate
End Sub

Private Sub WriteSyncStatus(ByVal message As String)
    On Error Resume Next
    With ThisWorkbook.Worksheets.Item(GuideSheetName()).Range("A14")
        .Value = message
        .Font.Bold = True
        .Font.Color = IIf(Left$(message, 4) = "Kh" & ChrW$(244) & "ng", RGB(185, 28, 28), RGB(5, 150, 105))
    End With
    On Error GoTo 0
End Sub

Private Function FindStudentRow(ByVal studentSheet As Worksheet, ByVal studentCode As String, ByVal classCode As String) As Long
    Dim rowNumber As Long
    Dim lastRow As Long

    lastRow = LastDataRow(studentSheet, 2, FIRST_DATA_ROW)
    For rowNumber = FIRST_DATA_ROW To lastRow
        If Trim$(CStr(studentSheet.Cells(rowNumber, 2).Value)) = studentCode And Trim$(CStr(studentSheet.Cells(rowNumber, 7).Value)) = classCode Then
            FindStudentRow = rowNumber
            Exit Function
        End If
    Next rowNumber
    FindStudentRow = 0
End Function

Private Function LastDataRow(ByVal ws As Worksheet, ByVal dataColumn As Long, ByVal firstRow As Long) As Long
    Dim lastCell As Range
    Set lastCell = ws.Columns(dataColumn).Find(What:="*", After:=ws.Cells(1, dataColumn), LookIn:=xlValues, SearchOrder:=xlByRows, SearchDirection:=xlPrevious)
    If lastCell Is Nothing Or lastCell.Row < firstRow Then
        LastDataRow = firstRow - 1
    Else
        LastDataRow = lastCell.Row
    End If
End Function

Private Function FindFooterRow(ByVal ws As Worksheet) As Long
    Dim lastRow As Long
    Dim rowNumber As Long
    lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row
    For rowNumber = FIRST_DATA_ROW To lastRow
        If UCase$(Trim$(CStr(ws.Cells(rowNumber, 1).Value))) = TotalLabel() Then
            FindFooterRow = rowNumber
            Exit Function
        End If
    Next rowNumber
    FindFooterRow = 0
End Function

Private Sub ClearOldFooter(ByVal ws As Worksheet, ByVal oldFooterRow As Long, ByVal newFooterRow As Long, ByVal lastColumn As Long)
    If oldFooterRow > 0 And oldFooterRow <> newFooterRow Then
        ws.Range(ws.Cells(oldFooterRow, 1), ws.Cells(oldFooterRow, lastColumn)).ClearContents
    End If
End Sub

Private Sub CopyFooterFormat(ByVal ws As Worksheet, ByVal oldFooterRow As Long, ByVal newFooterRow As Long, ByVal lastColumn As Long)
    If oldFooterRow > 0 And oldFooterRow <> newFooterRow Then
        ws.Range(ws.Cells(oldFooterRow, 1), ws.Cells(oldFooterRow, lastColumn)).Copy
        ws.Range(ws.Cells(newFooterRow, 1), ws.Cells(newFooterRow, lastColumn)).PasteSpecial xlPasteFormats
        Application.CutCopyMode = False
    End If
End Sub

Private Sub CopyDetailFormat(ByVal ws As Worksheet, ByVal templateRow As Long, ByVal targetRow As Long, ByVal lastColumn As Long)
    ws.Range(ws.Cells(templateRow, 1), ws.Cells(templateRow, lastColumn)).Copy
    ws.Range(ws.Cells(targetRow, 1), ws.Cells(targetRow, lastColumn)).PasteSpecial xlPasteFormats
    Application.CutCopyMode = False
End Sub

Private Sub SetFooter(ByVal ws As Worksheet, ByVal rowNumber As Long, ByVal lastColumn As Long, ByVal countFormula As String, ByVal paidFormula As String, ByVal debtFormula As String, ByVal monthlyDebtFormula As String, ByVal courseDebtOrAverageFormula As String)
    ws.Range(ws.Cells(rowNumber, 1), ws.Cells(rowNumber, lastColumn)).ClearContents
    ws.Cells(rowNumber, 1).Value = TotalLabel()
    If Len(countFormula) > 0 Then ws.Cells(rowNumber, 3).Formula = countFormula
    If Len(paidFormula) > 0 Then
        If lastColumn = 19 Then
            ws.Cells(rowNumber, 12).Formula = paidFormula
        ElseIf lastColumn = 24 Then
            ws.Cells(rowNumber, 19).Formula = paidFormula
        End If
    End If
    If Len(debtFormula) > 0 Then
        If lastColumn = 19 Then
            ws.Cells(rowNumber, 13).Formula = debtFormula
        ElseIf lastColumn = 24 Then
            ws.Cells(rowNumber, 20).Formula = debtFormula
        End If
    End If
    If lastColumn = 24 Then
        If Len(monthlyDebtFormula) > 0 Then ws.Cells(rowNumber, 21).Formula = monthlyDebtFormula
        If Len(courseDebtOrAverageFormula) > 0 Then ws.Cells(rowNumber, 22).Formula = courseDebtOrAverageFormula
    ElseIf lastColumn = 10 And Len(courseDebtOrAverageFormula) > 0 Then
        ws.Cells(rowNumber, 9).Formula = courseDebtOrAverageFormula
    ElseIf lastColumn = 13 And Len(courseDebtOrAverageFormula) > 0 Then
        ws.Cells(rowNumber, 12).Formula = courseDebtOrAverageFormula
    End If
End Sub

Private Function WorksheetExists(ByVal sheetName As String) As Boolean
    Dim targetSheet As Worksheet
    On Error Resume Next
    Set targetSheet = ThisWorkbook.Worksheets.Item(sheetName)
    WorksheetExists = Not targetSheet Is Nothing
    On Error GoTo 0
End Function

' Build Vietnamese sheet names with Unicode code points. This avoids depending on
' the Windows code page when the macro is embedded into a workbook by the website.
Private Function StudentSheetName() As String
    StudentSheetName = "H" & ChrW$(7884) & "C SINH"
End Function

Private Function TuitionSheetName() As String
    TuitionSheetName = "H" & ChrW$(7884) & "C PH" & ChrW$(205)
End Function

Private Function ClassSheetName() As String
    ClassSheetName = "L" & ChrW$(7898) & "P H" & ChrW$(7884) & "C"
End Function

Private Function GradesSheetName() As String
    GradesSheetName = "B" & ChrW$(7842) & "NG " & ChrW$(272) & "I" & ChrW$(7874) & "M"
End Function

Private Function DashboardSheetName() As String
    DashboardSheetName = "T" & ChrW$(7892) & "NG QUAN"
End Function

Private Function GuideSheetName() As String
    GuideSheetName = "H" & ChrW$(431) & ChrW$(7898) & "NG D" & ChrW$(7850) & "N"
End Function

Private Function ClassDetailSheetName(ByVal classCode As String) As String
    ClassDetailSheetName = "L" & ChrW$(7899) & "p " & classCode
End Function

Private Function TotalLabel() As String
    TotalLabel = "T" & ChrW$(7892) & "NG C" & ChrW$(7896) & "NG"
End Function

Private Function MonthlyTuitionLabel() As String
    MonthlyTuitionLabel = "H" & ChrW$(7885) & "c ph" & ChrW$(237) & " th" & ChrW$(225) & "ng"
End Function

Private Function CourseTuitionLabel() As String
    CourseTuitionLabel = "H" & ChrW$(7885) & "c ph" & ChrW$(237) & " kh" & ChrW$(243) & "a"
End Function

Private Function PaidStatus() As String
    PaidStatus = ChrW$(272) & ChrW$(227) & " " & ChrW$(273) & ChrW$(243) & "ng " & ChrW$(273) & ChrW$(7911)
End Function

Private Function UnderpaidStatus() As String
    UnderpaidStatus = ChrW$(272) & ChrW$(243) & "ng thi" & ChrW$(7871) & "u"
End Function

Private Function UnpaidStatus() As String
    UnpaidStatus = "Ch" & ChrW$(432) & "a " & ChrW$(273) & ChrW$(243) & "ng"
End Function

Private Function StudentNotFoundMessage() As String
    StudentNotFoundMessage = "Kh" & ChrW$(244) & "ng t" & ChrW$(236) & "m th" & ChrW$(7845) & "y h" & ChrW$(7885) & "c sinh"
End Function

Private Function SyncSuccessMessage() As String
    SyncSuccessMessage = ChrW$(272) & ChrW$(7891) & "ng b" & ChrW$(7897) & " t" & ChrW$(7921) & " " & ChrW$(273) & ChrW$(7897) & "ng ho" & ChrW$(7841) & "t " & ChrW$(273) & ChrW$(7897) & "ng."
End Function

Private Function SyncFailurePrefix() As String
    SyncFailurePrefix = "Kh" & ChrW$(244) & "ng th" & ChrW$(7875) & " " & ChrW$(273) & ChrW$(7891) & "ng b" & ChrW$(7897) & " " & ChrW$(7903) & " b" & ChrW$(432) & ChrW$(7899) & "c "
End Function

Private Function SyncQueuedMessage() As String
    SyncQueuedMessage = ChrW$(272) & "ang " & ChrW$(273) & ChrW$(7907) & "i " & ChrW$(273) & ChrW$(7891) & "ng b" & ChrW$(7897) & "..."
End Function

Private Function TuitionTotalNote() As String
    TuitionTotalNote = TotalLabel() & " " & ChrW$(273) & ChrW$(227) & " bao g" & ChrW$(7891) & "m c" & ChrW$(225) & "c kho" & ChrW$(7843) & "n nh" & ChrW$(7853) & "p tr" & ChrW$(7921) & "c ti" & ChrW$(7871) & "p " & ChrW$(7903) & " sheet " & StudentSheetName() & " (c" & ChrW$(7897) & "t n" & ChrW$(7873) & "n v" & ChrW$(224) & "ng M-R)."
End Function

Private Function ExcellentGradeLabel() As String
    ExcellentGradeLabel = "Gi" & ChrW$(7887) & "i"
End Function

Private Function GoodGradeLabel() As String
    GoodGradeLabel = "Kh" & ChrW$(225)
End Function

Private Function AverageGradeLabel() As String
    AverageGradeLabel = "Trung b" & ChrW$(236) & "nh"
End Function

Private Function NeedsSupportGradeLabel() As String
    NeedsSupportGradeLabel = "C" & ChrW$(7847) & "n h" & ChrW$(7895) & " tr" & ChrW$(7907)
End Function

Private Function SheetReference(ByVal sheetName As String) As String
    SheetReference = "'" & Replace(sheetName, "'", "''") & "'!"
End Function
