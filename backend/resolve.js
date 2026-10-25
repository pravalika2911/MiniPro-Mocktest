const https = require('https');

console.log("🔍 Attempting to bypass DNS block using Google DNS-over-HTTPS...");

https.get('https://dns.google/resolve?name=_mongodb._tcp.cluster0.sy6v7io.mongodb.net&type=SRV', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (!json.Answer || json.Answer.length === 0) {
        console.log("❌ Could not resolve cluster nodes. Your cluster might be paused or deleted.");
        process.exit(1);
      }
      
      const nodes = json.Answer.map(ans => ans.data.split(' ')[3].replace(/\.$/, ''));
      console.log("✅ Found your cluster nodes:");
      console.log(nodes);

      // Now we look up the replica set name using TXT record
      https.get('https://dns.google/resolve?name=cluster0.sy6v7io.mongodb.net&type=TXT', (resTxt) => {
        let txtData = '';
        resTxt.on('data', chunk => txtData += chunk);
        resTxt.on('end', () => {
          let replicaSet = 'atlas-14kxza-shard-0'; // Fallback if TXT fails
          try {
            const txtJson = JSON.parse(txtData);
            if (txtJson.Answer) {
              const txtRecord = txtJson.Answer[0].data;
              const match = txtRecord.match(/authSource=([^&]+)&replicaSet=([^&"]+)/);
              if (match) replicaSet = match[2];
            }
          } catch(e) {}

          const standardString = `mongodb://${nodes.join(',')}/mock-test-platform?ssl=true&replicaSet=${replicaSet}&authSource=admin&retryWrites=true&w=majority`;
          console.log("\n==================================");
          console.log("🎉 SUCCESS! HERE IS YOUR STANDARD CONNECTION STRING:");
          console.log(`\n${standardString}\n`);
          console.log("==================================");
          console.log("\n⚠️ ACTION REQUIRED: Update your .env file with this:");
          console.log(`MONGODB_URI=${standardString.replace('mongodb://', 'mongodb://pravalikavalupadasu29_db_user:Password123@')}`);
          
        });
      });
      
    } catch (e) {
      console.error("Error parsing DNS response", e.message);
    }
  });
}).on('error', (e) => {
  console.error("Error querying DNS:", e.message);
});
