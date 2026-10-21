/**
 * Helper to upload image files to backend / S3 via XMLHttpRequest.
 * 
 * In React Native / Expo (with modern WinterCG fetch), calling global `fetch`
 * with a legacy React Native FormData object `{ uri, name, type }` throws
 * `[Error: Unsupported FormDataPart implementation]`.
 * 
 * XMLHttpRequest uses React Native's native RCTNetworking module directly,
 * which natively processes `{ uri, name, type }` file parts on both Android and iOS.
 */

export const uploadImageViaXHR = (
    uploadUrl: string,
    token: string | null,
    fileUri: string,
    folder: string = 'general'
): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (fileUri.startsWith('http://') || fileUri.startsWith('https://')) {
            resolve(fileUri);
            return;
        }

        const filename = fileUri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        let type = 'image/jpeg';
        if (match) {
            const ext = match[1].toLowerCase();
            if (ext === 'png') type = 'image/png';
            else if (ext === 'webp') type = 'image/webp';
            else if (ext === 'gif') type = 'image/gif';
            else type = 'image/jpeg';
        }

        const formData = new FormData();
        // @ts-ignore - React Native XMLHttpRequest accepts { uri, name, type }
        formData.append('file', {
            uri: fileUri,
            name: filename,
            type,
        });
        formData.append('folder', folder);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl);

        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    if (data && data.url) {
                        resolve(data.url);
                    } else {
                        reject(new Error('Invalid response from upload server'));
                    }
                } catch {
                    reject(new Error('Failed to parse upload response'));
                }
            } else {
                let errorMsg = `Upload failed (${xhr.status})`;
                try {
                    const err = JSON.parse(xhr.responseText);
                    if (err.detail) errorMsg = err.detail;
                } catch {}
                reject(new Error(errorMsg));
            }
        };

        xhr.onerror = () => {
            reject(new Error('Network error uploading image'));
        };

        xhr.ontimeout = () => {
            reject(new Error('Upload timed out after 60s'));
        };

        xhr.timeout = 60000;
        xhr.send(formData);
    });
};
