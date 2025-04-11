import { createReadStream } from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import path from 'path';

async function uploadFile(filePath: string) {
  try {
    const fileName = path.basename(filePath);
    const form = new FormData();
    form.append('file', createReadStream(filePath), fileName);
    
    console.log(`Uploading ${fileName}...`);
    
    const response = await axios.post('http://localhost:5000/api/file-uploads/upload', form, {
      headers: {
        ...form.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    
    console.log('Upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

async function main() {
  try {
    // Upload improvements file
    await uploadFile('./attached_assets/imprv.csv');
    console.log('File uploaded successfully!');
  } catch (error) {
    console.error('Error in main:', error);
  }
}

main();