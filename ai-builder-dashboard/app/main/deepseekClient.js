const axios = require('axios');
const crypto = require('crypto');

const CHAT_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const CODE_ENDPOINT = 'https://api.deepseek.com/v1/code/completions';

function parseGeneratedFiles(content) {
  const files = [];
  const regex = /```file:(.+?)\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(content))) {
    files.push({
      path: match[1].trim(),
      content: match[2],
    });
  }
  return files;
}

async function runTask({ model, prompt, workspacePath, mode }) {
  if (!model) {
    throw new Error('Model is required');
  }
  if (!prompt) {
    throw new Error('Prompt is required');
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return {
      id: crypto.randomUUID(),
      message:
        'DeepSeek API key missing. Set the DEEPSEEK_API_KEY environment variable before running tasks.',
      files: [],
    };
  }

  const endpoint = model === 'deepseek-code' ? CODE_ENDPOINT : CHAT_ENDPOINT;
  const body =
    model === 'deepseek-code'
      ? {
          model: 'deepseek-code',
          messages: [
            { role: 'system', content: 'You are an AI pair programmer.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
        }
      : {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are AI Builder, an expert project assistant.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.4,
        };

  try {
    const response = await axios.post(endpoint, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });
    const message = response.data?.choices?.[0]?.message?.content || 'No response.';
    const files = mode === 'generate-files' ? parseGeneratedFiles(message) : [];
    return {
      id: response.data?.id || crypto.randomUUID(),
      message,
      files,
    };
  } catch (error) {
    return {
      id: crypto.randomUUID(),
      message: `DeepSeek API request failed: ${error.message}`,
      files: [],
    };
  }
}

module.exports = {
  runTask,
};
