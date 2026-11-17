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
    Assert-Equal $bookTask.Worksheets.Item('TỔNG QUAN').Range('B10').Hyperlinks.Count 1 'Numeric total hyperlink'

    $classMasterTask = $bookTask.Worksheets.Item('LỚP HỌC')
    $classMasterTask.Rows.Item(8).Insert() | Out-Null
    $classMasterTask.Range('B8').Value2 = '12'
    $classMasterTask.Range('C8').Value2 = 'New class'
    $studentTask.Rows.Item(7).Insert() | Out-Null
    $studentTask.Range('B7').Value2 = 'B'
    $studentTask.Range('C7').Value2 = 'Student B'
    $studentTask.Range('G7').Value2 = '12'
    $excelTask.Run("'" + $bookTask.Name + "'!SyncEngine.SyncNow")
    Assert-Equal ([string]$excelTask.Run("'" + $bookTask.Name + "'!SyncEngine.LastSyncError")) '' 'New class sync error'
    $newClassTask = $bookTask.Worksheets.Item('Lớp 12')
    Assert-Equal $newClassTask.Range('B12').Value2 'B' 'Automatically created class view'

    $tuitionTask.Rows.Item(8).Insert() | Out-Null
    $tuitionTask.Range('B8').Value2 = 'NEW-PAYMENT'
    $tuitionTask.Range('D8').Value2 = 'B'
    $tuitionTask.Range('F8').Value2 = '12'
    $tuitionTask.Range('H8').Value2 = 300000
    $tuitionTask.Range('I8').Value2 = 'Học phí tháng'
    $tuitionTask.Range('J8').Value2 = [double]([datetime]'2027-01-01').ToOADate()
    $tuitionTask.Range('L8').Value2 = 300000
    $tuitionTask.Range('O8').Value2 = [double]([datetime]'2027-01-15').ToOADate()
    $excelTask.Run("'" + $bookTask.Name + "'!SyncEngine.SyncNow")
    Assert-Equal ([string]$excelTask.Run("'" + $bookTask.Name + "'!SyncEngine.LastSyncError")) '' 'New month sync error'
    Assert-Equal $newClassTask.Range('D7').Value2 300000 'Automatically added January revenue'
    Assert-Equal $bookTask.Worksheets.Item('TỔNG QUAN').Range('F19').Value2 300000 'January overview revenue'
    Assert-Equal $bookTask.Worksheets.Item('TỔNG QUAN').Range('G19').Hyperlinks.Count 1 'New class total hyperlink'

    $gradeTask = $bookTask.Worksheets.Item('BẢNG ĐIỂM')
    $gradeTask.Range('E6').Value2 = 9
    $studentTask.Range('B6').Value2 = 'A-RENAMED'
    $classMasterTask.Range('B7').Value2 = '11-RENAMED'
    $excelTask.Run("'" + $bookTask.Name + "'!SyncEngine.SyncNow")
    Assert-Equal ([string]$excelTask.Run("'" + $bookTask.Name + "'!SyncEngine.LastSyncError")) '' 'Identifier rename sync error'
    Assert-Equal $tuitionTask.Range('D6').Value2 'A-RENAMED' 'Receipt follows stable student ID'
    Assert-Equal $tuitionTask.Range('F7').Value2 '11-RENAMED' 'Receipt follows renamed class'
    Assert-Equal $gradeTask.Range('E6').Value2 9 'Scores survive student code rename'
    Assert-Equal $gradeTask.Range('L6').Value2 0.9 'Partial scores use the same zero handling as the website'
    Assert-Equal $classTask.Range('B12').Value2 'A-RENAMED' 'Class view follows renamed student'
    Assert-Equal $classTask.Range('G12').Hyperlinks.Count 1 'Student revenue link survives rebuilding'
    $excelTask.EnableEvents = $true
    $studentTask.Range('C6').Value2 = 'Automatic event update'
    Start-Sleep -Seconds 3
    $excelTask.EnableEvents = $false
    Assert-Equal $classTask.Range('C12').Value2 'Automatic event update' 'SheetChange automatically synchronizes'
    $excelTask.EnableEvents = $true
    $studentTask.Range('C6').Value2 = 'Saved immediately'
    $nameBeforeSaveTask = $bookTask.Name
    $excelTask.DisplayAlerts = $false
    try { $bookTask.SaveAs((Join-Path (Get-Location) '.review/excel-native-edited.xlsm'),52) } catch {}
    Assert-Equal $bookTask.Name $nameBeforeSaveTask 'Saving waits for pending synchronization'
    Start-Sleep -Seconds 3
    $excelTask.DisplayAlerts = $false
    $bookTask.SaveAs((Join-Path (Get-Location) '.review/excel-native-edited.xlsm'),52)
    Assert-Equal $bookTask.Name 'excel-native-edited.xlsm' 'Save As file name'
    $excelTask.EnableEvents = $false
    Assert-Equal $classTask.Range('C12').Value2 'Saved immediately' 'Save As succeeds after synchronization'

    $tuitionTask.Rows.Item(8).Delete() | Out-Null
    $studentTask.Rows.Item(7).Delete() | Out-Null
    $classMasterTask.Rows.Item(8).Delete() | Out-Null
    $excelTask.Run("'" + $bookTask.Name + "'!SyncEngine.SyncNow")
    $removedClassTask = $null
    try { $removedClassTask = $bookTask.Worksheets.Item('Lớp 12') } catch {}
    Assert-Equal ($null -eq $removedClassTask) $true 'Removed class derived view'

    # Extend past the former 1000-row limit and confirm live range/lookup growth.
    $largeCodesTask = New-Object 'object[,]' 1040,2
    for ($iTask = 0; $iTask -lt 1040; $iTask++) {
        $largeCodesTask[$iTask,0] = 'EXTRA-' + $iTask
        $largeCodesTask[$iTask,1] = 'Extra student ' + $iTask
    }
    $studentTask.Range('A7:AG7').ClearContents()
    $studentTask.Range('B7:C1046').Value2 = $largeCodesTask
    $excelTask.Run("'" + $bookTask.Name + "'!SyncEngine.SyncNow")
    Assert-Equal ([string]$excelTask.Run("'" + $bookTask.Name + "'!SyncEngine.LastSyncError")) '' 'Large roster sync error'
    Assert-Equal $bookTask.Names.Item('PPTE_HS_B').RefersToRange.Rows.Count 1041 'Source range grows past 1000'
    Assert-Equal $bookTask.Worksheets.Item('TỔNG QUAN').Range('B7').Value2 1041 'All students counted'
    if (-not $lookupTask.Range('B1050').HasFormula) { throw 'Lookup formulas did not grow past 300 rows' }

    $studentTask.Range('A6:AG1047').ClearContents()
    $tuitionTask.Range('A6:U12').UnMerge()
    $tuitionTask.Range('A6:U12').ClearContents()
    $excelTask.Run("'" + $bookTask.Name + "'!SyncEngine.SyncNow")
    Assert-Equal ([string]$excelTask.Run("'" + $bookTask.Name + "'!SyncEngine.LastSyncError")) '' 'Empty source sync error'
    Assert-Equal $bookTask.Worksheets.Item('TỔNG QUAN').Range('B7').Value2 0 'Empty roster count'
    Assert-Equal $bookTask.Worksheets.Item('TỔNG QUAN').Range('B10').Value2 0 'Empty revenue'
    if ($null -ne $excelTask.CircularReference) { throw 'Circular formula in empty workbook' }
    $bookTask.Close($false)
    Write-Output 'Passed native Excel: sync, class totals, add/delete, new class/month, stable identifier renames, hyperlinks, 1041 students, expanded lookup, empty sources, and no circular references.'
} finally { try { $excelTask.Quit() } catch { Write-Warning 'The isolated Excel test instance did not accept Quit.' } }

