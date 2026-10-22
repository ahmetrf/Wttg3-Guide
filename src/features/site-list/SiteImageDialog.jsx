import { useEffect, useRef, useState } from 'react';

function siteFolderName(name) {
  const folder = name
    .replace(/\s*\[H(?:87|40)\]\s*$/i, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
  return folder === 'eatmy' ? 'ems' : folder;
}

export default function SiteImageDialog({ siteName, onClose }) {
  const dialogRef = useRef(null);
  const viewerRef = useRef(null);
  const [images, setImages] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteName) return undefined;
    const dialog = dialogRef.current;
    const controller = new AbortController();
    if (!dialog.open) dialog.showModal();

    async function loadImages() {
      try {
        const folder = siteFolderName(siteName);
        const response = await fetch(`/api/site-images?folder=${encodeURIComponent(folder)}`, {
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`Image API request failed with status ${response.status}.`);
        const data = await response.json();
        if (!data || !Array.isArray(data.images)) {
          throw new Error('The site image response must include an images array.');
        }
        const imageList = data.images.map((file) => ({
          file,
          label: file.replace(/\.png$/i, ''),
          url: `/Sites/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`
        }));
        setImages(imageList);
        setSelectedFile(imageList[0]?.file || '');
      } catch (loadError) {
        if (loadError.name === 'AbortError') return;
        console.error(`Could not load images for ${siteName}.`, loadError);
        setError('Could not load this site’s images. Please try again later.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadImages();
    return () => {
      controller.abort();
      if (dialog.open) dialog.close();
    };
  }, [siteName]);

  const selectedImage = images.find((image) => image.file === selectedFile);

  async function toggleFullscreen() {
    const viewer = viewerRef.current;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (viewer?.requestFullscreen) {
      await viewer.requestFullscreen();
    } else {
      setError('Full-screen viewing is not supported by this browser.');
    }
  }

  return (
    <dialog
      aria-labelledby="site-dialog-title"
      className="site-dialog"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      ref={dialogRef}
    >
      <div className="dialog-header">
        <h2 id="site-dialog-title">{siteName}</h2>
        <button aria-label="Close image viewer" className="dialog-close" onClick={onClose} type="button">&times;</button>
      </div>
      {images.length > 0 && (
        <div aria-label="Site images" className="image-tabs" role="tablist">
          {images.map((image) => (
            <button
              aria-selected={selectedFile === image.file}
              className="image-tab"
              key={image.file}
              onClick={() => {
                setSelectedFile(image.file);
                setError('');
              }}
              role="tab"
              type="button"
            >
              {image.label}
            </button>
          ))}
          <ul aria-label="Site image markers" className="image-legend">
            <li><span className="image-legend-swatch fetch" />Fetch</li>
            <li><span className="image-legend-swatch key" />Key</li>
          </ul>
        </div>
      )}
      <div aria-live="polite" className="site-image-viewer" ref={viewerRef}>
        {loading ? (
          <p className="image-message">Loading images...</p>
        ) : error ? (
          <p className="image-message">{error}</p>
        ) : selectedImage ? (
          <img
            alt={`${siteName} - ${selectedImage.label}`}
            onClick={toggleFullscreen}
            onError={() => setError(`Could not load ${selectedImage.file}.`)}
            src={selectedImage.url}
          />
        ) : (
          <p className="image-message">No PNG images found for this site.</p>
        )}
      </div>
    </dialog>
  );
}
