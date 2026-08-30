Option Explicit

Private Sub Workbook_SheetChange(ByVal Sh As Object, ByVal Target As Range)
    If SyncEngine.IsSyncing Then Exit Sub
    If Target Is Nothing Then Exit Sub

    If SyncEngine.IsStudentSheet(CStr(Sh.Name)) Then
        If Target.CountLarge > 1 Or Not Intersect(Target, Sh.Range("B:B,G:G,M:O")) Is Nothing Then SyncEngine.QueueSync
    ElseIf SyncEngine.IsTuitionSheet(CStr(Sh.Name)) Then
        If Target.CountLarge > 1 Or Not Intersect(Target, Sh.Range("B:B,D:D,F:F,I:I,L:M")) Is Nothing Then SyncEngine.QueueSync
    End If
End Sub
