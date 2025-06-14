// Test script to validate CSV parsing fixes
// Run this in browser console on the Phase 6 test page

console.log('🧪 Testing CSV parsing fixes for non-duty entries...');

// Test CSV content with various non-duty entries
const testCSVContent = `flydubai,,,,,,,
,,,,,,,
January 2025,,,,,,,
,,,,,,,
Date,Duties,Details,Report times,Actual times/Delays,Debrief times,Indicators,Crew
01/01/2025,Day off,,,,,,
02/01/2025,FZ549 FZ550,DXB - CMB CMB - DXB,9:20,,21:15,,
03/01/2025,REST DAY,,,,,,
04/01/2025,FZ967,DXB - VKO,22:30,,05:45¹,,
05/01/2025,FZ968,VKO - DXB,05:15,,12:25,,
06/01/2025,Additional Day OFF,,,,,,
07/01/2025,ASBY,Airport Standby,08:00,,12:00,,
08/01/2025,Day off,,,,,,
09/01/2025,FZ321,DXB - DEL,14:30,,20:45,,
10/01/2025,Day off,,,,,,
11/01/2025,REST DAY,,,,,,
12/01/2025,FZ1626,DXB - CMB,10:15,,16:30,,
Total Hours and Statistics,,,,,,,`;

// Import the parsing function (this should be available on the page)
if (typeof parseFlightDutiesFromCSV !== 'undefined') {
  console.log('✅ parseFlightDutiesFromCSV function found');
  
  try {
    const result = parseFlightDutiesFromCSV(testCSVContent, 'test-user');
    
    console.log('📊 Parsing Results:', result);
    
    // Count warnings related to "Day off", "REST DAY", etc.
    const offDayWarnings = result.warnings?.filter(warning => 
      warning.includes('Day off') || 
      warning.includes('REST DAY') || 
      warning.includes('Additional Day OFF')
    ) || [];
    
    const sectorWarnings = result.warnings?.filter(warning => 
      warning.includes('No valid sectors found')
    ) || [];
    
    const flightNumberWarnings = result.warnings?.filter(warning => 
      warning.includes('No valid flight numbers or duty types found')
    ) || [];
    
    console.log('📈 Test Results Summary:');
    console.log(`  - Total flights parsed: ${result.data?.length || 0}`);
    console.log(`  - Total warnings: ${result.warnings?.length || 0}`);
    console.log(`  - Off day warnings: ${offDayWarnings.length}`);
    console.log(`  - Sector warnings: ${sectorWarnings.length}`);
    console.log(`  - Flight number warnings: ${flightNumberWarnings.length}`);
    
    if (offDayWarnings.length === 0) {
      console.log('✅ TEST PASSED! No warnings for non-duty entries.');
    } else {
      console.log('❌ TEST FAILED! Still generating warnings for non-duty entries:');
      offDayWarnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    if (result.warnings && result.warnings.length > 0) {
      console.log('⚠️ All warnings:');
      result.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
} else {
  console.log('❌ parseFlightDutiesFromCSV function not found. Make sure you are on the correct page.');
}
