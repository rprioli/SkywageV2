/**
 * Clear test data script
 * Removes any existing flights for the test user to ensure clean testing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

async function clearTestData() {
  console.log('🧹 Clearing test data for user:', TEST_USER_ID);
  console.log('');

  try {
    // Check existing flights
    const { data: existingFlights, error: fetchError } = await supabase
      .from('flights')
      .select('id, date, flight_numbers, month, year')
      .eq('user_id', TEST_USER_ID);

    if (fetchError) {
      console.error('❌ Error fetching existing flights:', fetchError.message);
      return;
    }

    console.log(`📊 Found ${existingFlights?.length || 0} existing flights`);
    
    if (existingFlights && existingFlights.length > 0) {
      console.log('Existing flights:');
      existingFlights.forEach((flight, index) => {
        console.log(`  ${index + 1}. ${flight.date} - ${flight.flight_numbers?.join(', ') || 'N/A'} (${flight.month}/${flight.year})`);
      });
      console.log('');

      // Delete existing flights
      const { error: deleteError } = await supabase
        .from('flights')
        .delete()
        .eq('user_id', TEST_USER_ID);

      if (deleteError) {
        console.error('❌ Error deleting flights:', deleteError.message);
        return;
      }

      console.log('✅ Deleted all existing flights');
    } else {
      console.log('✅ No existing flights found');
    }

    // Check existing monthly calculations
    const { data: existingCalculations, error: calcFetchError } = await supabase
      .from('monthly_calculations')
      .select('id, month, year, total_salary')
      .eq('user_id', TEST_USER_ID);

    if (calcFetchError) {
      console.error('❌ Error fetching existing calculations:', calcFetchError.message);
      return;
    }

    console.log(`📊 Found ${existingCalculations?.length || 0} existing monthly calculations`);
    
    if (existingCalculations && existingCalculations.length > 0) {
      console.log('Existing calculations:');
      existingCalculations.forEach((calc, index) => {
        console.log(`  ${index + 1}. ${calc.month}/${calc.year} - ${calc.total_salary} AED`);
      });
      console.log('');

      // Delete existing calculations
      const { error: deleteCalcError } = await supabase
        .from('monthly_calculations')
        .delete()
        .eq('user_id', TEST_USER_ID);

      if (deleteCalcError) {
        console.error('❌ Error deleting calculations:', deleteCalcError.message);
        return;
      }

      console.log('✅ Deleted all existing calculations');
    } else {
      console.log('✅ No existing calculations found');
    }

    console.log('');
    console.log('🎯 Test environment is now clean and ready for upload testing!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Open http://localhost:3001/dashboard');
    console.log('2. Click "Upload Roster"');
    console.log('3. Select "April" from dropdown');
    console.log('4. Upload April_ScheduleReport.csv');
    console.log('5. Verify April flights appear in dashboard');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

clearTestData();
