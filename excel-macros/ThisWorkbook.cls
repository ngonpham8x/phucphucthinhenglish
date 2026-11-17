Option Explicit

Private Sub Workbook_Open()
    SyncEngine.QueueSync
End Sub

Private Sub Workbook_BeforeSave(ByVal SaveAsUI As Boolean, Cancel As Boolean)
    ' A pending callback must finish before saving/renaming its workbook.
    ' Do not run the synchronizer or mutate cells inside Excel's save event.
    If SyncEngine.HasQueuedSync Or SyncEngine.IsSyncing Then
        Cancel = True
        If Application.DisplayAlerts Then SyncEngine.NotifyPendingSave
    End If
End Sub

Private Sub Workbook_SheetChange(ByVal Sh As Object, ByVal Target As Range)
    If SyncEngine.IsSyncing Then Exit Sub
    If Target Is Nothing Then Exit Sub

    If SyncEngine.IsStudentSheet(CStr(Sh.Name)) Then
        ' B/G identify the student and class; M:R are all manual direct-payment
        ' inputs (amount, debt, type, period, date and method).
        If Target.CountLarge > 1 Or Not Intersect(Target, Sh.Range("B:AG")) Is Nothing Then SyncEngine.QueueSync
    ElseIf SyncEngine.IsTuitionSheet(CStr(Sh.Name)) Then
        If Target.CountLarge > 1 Or Not Intersect(Target, Sh.Range("B:Q")) Is Nothing Then SyncEngine.QueueSync
    ElseIf CStr(Sh.Name) = "L" & ChrW$(7898) & "P H" & ChrW$(7884) & "C" Then
        SyncEngine.QueueSync
    End If
End Sub

Private Sub Workbook_BeforeClose(Cancel As Boolean)
    SyncEngine.CancelQueuedSync
End Sub
