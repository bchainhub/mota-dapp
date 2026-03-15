import { toast } from '$components';

/**
 * Copies text to clipboard and shows a toast notification
 * @param text - The text to copy
 * @param successMessage - Success message to display
 * @param errorMessage - Error message to display
 */
export function copyToClipboard(
	text: string,
	successMessage: string,
	errorMessage: string
): void {
	navigator.clipboard
		.writeText(text)
		.then(() => {
			toast.success(successMessage);
		})
		.catch((err) => {
			toast.error(errorMessage);
		});
}

/**
 * Downloads text content as a file
 * @param content - The text content to download
 * @param filename - The filename for the downloaded file
 * @param mimeType - The MIME type of the file (default: 'text/plain')
 */
export function downloadTextFile(
	content: string,
	filename: string,
	mimeType: string = 'text/plain'
): void {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/**
 * Downloads a GPG key as a .asc file
 * @param keyContent - The GPG key content
 * @param keyName - The name to use for the file (without extension)
 */
export function downloadGPGKey(keyContent: string, keyName: string): void {
	downloadTextFile(keyContent, `${keyName}.asc`, 'application/pgp-keys');
}
