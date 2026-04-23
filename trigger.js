/**
 * OpenClaw-Compatible CLI Trigger
 * 
 * This CLI simulates an OpenClaw agent calling the ClawFlow webhook endpoint.
 * It sends the exact payload format that OpenClaw agents use:
 * { trigger_id, flow, input }
 * 
 * Usage: node trigger.js
 * Requires: Next.js dev server running on port 3000
 */

const prompts = require('prompts');
// Using global fetch (available in Node.js 18+)

// Hardcoded for CLI experience, ideally fetched from /api/flows
const availableFlows = [
  { title: '📋 Task-Claw (Break into actionable tasks)', value: 'task' },
  { title: '🔍 Debug-Claw (Analyze errors and logs)', value: 'debug' },
  { title: '🧠 Brain-Claw (Product planning from idea)', value: 'brain' },
  { title: '✨ Clean-Claw (Normalize messy text)', value: 'clean' },
  { title: '📝 Summary-Claw (Extract key points)', value: 'summary' },
  { title: '⚡ Pipeline-Claw (Clean -> Task -> Brain)', value: 'pipeline' },
  { title: '📅 Calendar-Claw (Extract event details)', value: 'calendar' },
  { title: '🐙 Git-Claw (Parse diffs & commit logs)', value: 'git' },
  { title: '📊 CSV-Claw (Messy CSV to clean JSON)', value: 'csv' },
  { title: '📧 Email-Claw (Draft professional emails)', value: 'email' },
  { title: '📓 Note-Claw (Format markdown notes)', value: 'note' },
  { title: '{} JSON-Claw (Validate & format JSON)', value: 'json' },
  { title: '↔️ Diff-Claw (Word-level text comparison)', value: 'diff' },
  { title: '😊 Sentiment-Claw (Extract emotional tone)', value: 'sentiment' }
];

async function run() {
  console.log('\n=========================================');
  console.log('   ⚡ OpenClaw → ClawFlow Bridge');
  console.log('=========================================\n');
  console.log('This CLI simulates an OpenClaw agent calling ClawFlow.');
  console.log('Payload format: { trigger_id, flow, input }\n');

  const response = await prompts([
    {
      type: 'select',
      name: 'flow',
      message: 'Select a ClawFlow skill to execute:',
      choices: availableFlows,
      initial: 0
    },
    {
      type: 'text',
      name: 'input',
      message: 'Enter input for the skill:',
      validate: value => value.length > 0 ? true : 'Input cannot be empty'
    }
  ]);

  if (!response.flow || !response.input) {
    console.log('\n❌ Operation cancelled.');
    return;
  }

  const triggerId = `cli-${Date.now()}`;
  
  console.log(`\n📤 Sending webhook to ClawFlow...`);
  console.log(`   Endpoint: POST /api/webhook/openclaw`);
  console.log(`   Flow: ${response.flow}`);
  console.log(`   Trigger ID: ${triggerId}\n`);
  
  try {
    const startTime = Date.now();
    
    // Call the OpenClaw webhook endpoint with proper payload format
    const res = await fetch("http://localhost:3000/api/webhook/openclaw", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        // "x-api-key": "your-api-key-here" // Uncomment if OPENCLAW_API_KEY is set
      },
      body: JSON.stringify({ 
        trigger_id: triggerId,
        flow: response.flow, 
        input: response.input 
      }),
    });

    const data = await res.json();
    const duration = Date.now() - startTime;

    if (!res.ok) {
      console.error('\n❌ Webhook Error:', data.error || 'Unknown error');
      return;
    }

    console.log('✅ OpenClaw-Compatible Response:');
    console.log(`   Status: ${data.status}`);
    console.log(`   Bridge Version: ${data.bridge_version}`);
    console.log(`   Trigger ID: ${data.trigger_id}\n`);
    
    console.log('📊 Execution Data:');
    console.log(`   Success: ${data.execution_data.success}`);
    console.log(`   Engine Duration: ${data.execution_data.duration}ms`);
    
    if (data.execution_data.steps) {
      console.log('\n📝 Execution Steps:');
      data.execution_data.steps.forEach((step, idx) => {
        console.log(`   ${idx + 1}. ${step}`);
      });
    }

    console.log('\n📦 Result Output:');
    console.log(JSON.stringify(data.execution_data.output, null, 2));

    console.log(`\n⏱️  Total Roundtrip: ${duration}ms (includes network overhead)\n`);
    console.log('💡 In production, OpenClaw agents receive this structured data');
    console.log('   to make their next orchestration decision.\n');
    
  } catch (err) {
    console.error("\n❌ Trigger failed. Is the Next.js server running on port 3000?", err.message);
  }
}

run();
