const { WebhookEvent } = require('./src/db/models/sequelize');

async function checkEvents() {
  try {
    const events = await WebhookEvent.findAll({
      order: [['id', 'DESC']],
      limit: 5,
      raw: true
    });
    
    console.log('\n========================================');
    console.log('WEBHOOK EVENTS VERIFICATION');
    console.log('========================================\n');
    console.log(`Total events found: ${events.length}\n`);
    
    events.forEach((event, i) => {
      console.log(`\n[Event ${i + 1}] ID: ${event.id}`);
      console.log(`  Event Type: ${event.event_type}`);
      console.log(`  Webhook Type: ${event.webhook_type || 'N/A'}`);
      console.log(`  From: ${event.from || 'N/A'}`);
      console.log(`  Message ID: ${event.message_id || 'N/A'}`);
      console.log(`  Message Type: ${event.message_type || 'N/A'}`);
      console.log(`  Status Type: ${event.status_type || 'N/A'}`);
      console.log(`  Error Code: ${event.error_code || 'None'}`);
      console.log(`  Error Message: ${event.error_message || 'None'}`);
      console.log(`  Created: ${event.created_at}`);
});
    
    console.log('\n========================================\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkEvents();
