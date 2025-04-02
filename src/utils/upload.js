import { deleteObject, getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';

// Helper function to get current date and time
const getCurrentDateTime = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}:${String(today.getSeconds()).padStart(2, '0')}`;
};

// Common function to handle file uploads
const uploadFile = async (file, folderPath) => {
    const dateTime = getCurrentDateTime();
    const storage = getStorage();

    const path = `${folderPath}/${file.originalname}/${dateTime}`;
    const storageRef = ref(storage, path);

    const metadata = { contentType: file.mimetype };
    const snapshot = await uploadBytesResumable(storageRef, file.buffer, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return { downloadURL, urlRef: path, originalName: file.originalname };
};

// Upload files to Firebase Storage
export const uploadFiles = async (files) => {
    try {
        const results = await Promise.all(files.map((file) => uploadFile(file, 'files')));

        return {
            fileUrls: results.map((r) => r.downloadURL),
            fileUrlRefs: results.map((r) => r.urlRef),
            originNames: results.map((r) => r.originalName),
        };
    } catch (error) {
        console.error('Error uploading files: ', error);
        throw new Error('File upload failed');
    }
};

export const uploadSingleFile = async (file, folder = 'images') => {
    const result = await uploadFile(file, folder);
    return { downloadURL: result.downloadURL, urlRef: result.urlRef };
};

export const removeUploadedFile = async (urlRef) => {
    const storage = getStorage();
    const desertRef = ref(storage, urlRef);

    try {
        await deleteObject(desertRef);
        console.log('File deleted successfully');
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
};
