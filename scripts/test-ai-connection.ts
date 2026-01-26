import { AiService } from '../services/aiService';

(async () => {
    console.log('Testing AI Service Connection...');
    const healthy = await AiService.checkHealth();
    if (healthy) {
        console.log('✅ AI Service is connected and healthy!');
    } else {
        console.error('❌ Failed to connect to AI Service.');
        process.exit(1);
    }
})();
