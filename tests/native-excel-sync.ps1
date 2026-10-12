$ErrorActionPreference = 'Stop'
function Assert-Equal($actual, $expected, $label) {
    if ($actual -ne $expected) { throw "$label expected $expected, got $actual" }
}
$excelTask = New-Object -ComObject Excel.Application
$excelTask.Visible = $false
$excelTask.DisplayAlerts = $false
$excelTask.EnableEvents = $false
try {
    $bookTask = $excelTask.Workbooks.Open((Join-Path (Get-Location) '.review/excel-sync-fixture.xlsm'))
    $studentTask = $bookTask.Worksheets.Item('HỌC SINH')
    $tuitionTask = $bookTask.Worksheets.Item('HỌC PHÍ')
    $classTask = $bookTask.Worksheets.Item('Lớp 11')
    $excelTask.Run("'" + $bookTask.Name + "'!SyncEngine.SyncNow")
    Assert-Equal ([string]$excelTask.Run("'" + $bookTask.Name + "'!SyncEngine.LastSyncError")) '' 'Macro error'
    Assert-Equal $classTask.Range('B12').Value2 'A' 'Second class student'
    Assert-Equal $classTask.Range('G12').Value2 500000 'Second class revenue'
    Assert-Equal $classTask.Range('H12').Value2 500000 'Second class debt'
    $lookupTask = $bookTask.Worksheets.Item('TRA CỨU LỚP')
    $lookupTask.Range('B4').Value2 = '11'
    $excelTask.CalculateFull()
    Assert-Equal $lookupTask.Range('B11').Value2 'A' 'Lookup roster'
    Assert-Equal $lookupTask.Range('G11').Value2 500000 'Lookup class revenue'
    $class10Task = $bookTask.Worksheets.Item('Lớp 10')
    Assert-Equal $class10Task.Range('C7').Value2 2000000 'October revenue'
    $tuitionTask.Range('O7').Value2 = [double]([datetime]'2026-08-20').ToOADate()
    $excelTask.CalculateFull()
    Assert-Equal $class10Task.Range('C7').Value2 0 'Revenue after collection date change'
    Assert-Equal $class10Task.Range('B7').Value2 4000000 'August revenue after date change'
    $tuitionTask.Range('O7').Value2 = [double]([datetime]'2026-10-10').ToOADate()
    $studentTask.Range('C6').Value2 = 'Renamed A'
    $excelTask.Run("'" + $bookTask.Name + "'!SyncEngine.SyncNow")
    Assert-Equal $classTask.Range('C12').Value2 'Renamed A' 'Rename sync'
    $tuitionTask.Rows.Item(7).Delete() | Out-Null
    $excelTask.Run("'" + $bookTask.Name + "'!SyncEngine.SyncNow")
    Assert-Equal $tuitionTask.Range('M6').Value2 2000000 'Debt after deleting final installment'
    $studentTask.Rows.Item(6).Insert() | Out-Null
    $studentTask.Range('B6').Value2 = 'B'
    $studentTask.Range('C6').Value2 = 'Student B'
    $studentTask.Range('G6').Value2 = '11'
    $excelTask.Run("'" + $bookTask.Name + "'!SyncEngine.SyncNow")
    Assert-Equal $classTask.Range('B12').Value2 'B' 'Added student'
    Assert-Equal $classTask.Range('B13').Value2 'A' 'Existing student retained'
    $studentTask.Rows.Item(6).Delete() | Out-Null
    $excelTask.Run("'" + $bookTask.Name + "'!SyncEngine.SyncNow")
    Assert-Equal $classTask.Range('B12').Value2 'A' 'Deleted student'
    $bookTask.Close($false)
    Write-Output 'Passed native Excel: sync, class totals, rename, add, delete, debt restoration.'
} finally { $excelTask.Quit() }

