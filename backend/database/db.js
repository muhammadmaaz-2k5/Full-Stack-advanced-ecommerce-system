const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

const supabaseUrl = config.SUPABASE_URL;
const supabaseKey = config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key in config");
}

const supabase = createClient(supabaseUrl, supabaseKey);

exports.supabase = supabase;
exports.connectToDB = async () => {
    try {
        const { error } = await supabase.from('users').select('_id', { count: 'exact', head: true });
        if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
            console.log('Supabase check status:', error.message);
        } else {
            console.log('connected to Supabase DB');
        }
    } catch (error) {
        console.log('Error connecting to Supabase:', error);
    }
};
