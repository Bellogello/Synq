import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import Cropper from 'react-easy-crop';

// --- CANVAS UTILITY TO EXTRACT THE CROPPED PIXELS ---
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      blob.name = 'cropped_avatar.jpeg';
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}
// ----------------------------------------------------

const THEMES = [
  { id: 'dark', name: 'Synq Classic', bg: '#0b111e', primary: '#14b8a6', secondary: '#818cf8' },
  { id: 'midnight-rose', name: 'Midnight Rose', bg: '#F8E9EB', primary: '#051F45', secondary: '#8E3B46' },
  { id: 'slate-peach', name: 'Slate Peach', bg: '#1A2226', primary: '#FFCDC1', secondary: '#E07A5F' },
  { id: 'crimson-night', name: 'Crimson Night', bg: '#120812', primary: '#C30F45', secondary: '#F4A261' },
  { id: 'mint-marine', name: 'Mint Marine', bg: '#001A33', primary: '#DCF4A2', secondary: '#FFB703' },
  { id: 'warm-mocha', name: 'Warm Mocha', bg: '#F5EBE0', primary: '#6C584C', secondary: '#A98467' },
];

export default function Settings() {
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [userId, setUserId] = useState(null);
  
  // Profile State
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarSeed, setAvatarSeed] = useState('Felix');
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // NEW: Cropper State
  const [imageSrc, setImageSrc] = useState(null); // The raw file selected
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

useEffect(() => {
  const savedTheme = localStorage.getItem('synq_theme') || 'dark';
  setCurrentTheme(savedTheme);
  document.documentElement.setAttribute('data-theme', savedTheme);
  loadProfile();
}, []);

  const loadProfile = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    setUserId(user.id);

    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) {
      if (data.full_name) setFullName(data.full_name);
      if (data.avatar_url) setAvatarUrl(data.avatar_url);
      if (data.avatar_seed) setAvatarSeed(data.avatar_seed);
    } else {
      await supabase.from('profiles').insert([{ id: user.id }]);
    }
  };

  // 1. Intercept the file selection to show the cropper
  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result));
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // 2. Process the crop and upload it to Supabase
  const uploadCroppedImage = async () => {
    try {
      setUploading(true);
      
      // Get the physically cropped Blob from our canvas utility
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      // Convert Blob to a File for Supabase
      const file = new File([croppedImageBlob], 'cropped_avatar.jpeg', { type: 'image/jpeg' });

      const fileName = `${userId}-${Math.random()}.jpeg`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setAvatarUrl(data.publicUrl);
      await supabase.from('profiles').upsert({ id: userId, avatar_url: data.publicUrl });

      // Close the modal
      setImageSrc(null);
    } catch (error) {
      alert('Error uploading avatar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    const { error } = await supabase.from('profiles').upsert({ 
      id: userId, 
      full_name: fullName.trim(), 
      avatar_url: avatarUrl,
      avatar_seed: avatarSeed 
    });

    if (error) alert("Error saving profile: " + error.message);
    else alert("Profile saved successfully!");
    
    setIsSaving(false);
  };

  const changeTheme = (themeId) => {
    setCurrentTheme(themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('synq_theme', themeId);
  };

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-8 pb-[8rem] pt-[1rem]">
        
        <div>
          <h2 className="font-headline-md text-[1.5rem] text-on-surface">Your Identity</h2>
          <p className="text-[0.875rem] text-on-surface-variant mt-1">This is how you will appear in your Squads.</p>
        </div>

        <form onSubmit={saveProfile} className="glass-card rounded-2xl p-6 border border-outline-variant/20 flex flex-col md:flex-row gap-8 items-center md:items-start">
          
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-[8rem] h-[8rem] rounded-full overflow-hidden bg-surface-container-highest border-4 border-surface shadow-xl group">
              {uploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-surface/50 backdrop-blur-sm z-10">
                  <span className="material-symbols-outlined animate-spin text-primary text-[2rem]">autorenew</span>
                </div>
              ) : null}
              
              <img 
                src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=transparent`} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
              
              {/* File Input triggers the Cropper now! */}
              <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="material-symbols-outlined text-[2rem]">photo_camera</span>
                <span className="text-[0.625rem] font-bold uppercase tracking-wider mt-1">Upload</span>
                <input type="file" accept="image/*" onChange={onFileChange} disabled={uploading} className="hidden" />
              </label>
            </div>
            
            {!avatarUrl && (
              <button type="button" onClick={() => setAvatarSeed(Math.random().toString(36).substring(7))} className="text-[0.75rem] font-bold text-on-surface-variant flex items-center gap-1 hover:text-primary active:scale-95 transition-colors">
                <span className="material-symbols-outlined text-[1rem]">cycle</span> Randomize
              </button>
            )}
            {avatarUrl && (
               <button type="button" onClick={() => setAvatarUrl(null)} className="text-[0.75rem] font-bold text-error flex items-center gap-1 active:scale-95 transition-colors">
                 Remove Photo
               </button>
            )}
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div className="space-y-1">
              <label className="font-label-md text-on-surface-variant px-1 text-[0.875rem]">Display Name</label>
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Belal Mahmoud" className="w-full bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-lg px-4 py-3 text-[1rem] focus:ring-1 focus:ring-primary outline-none" />
            </div>
            <button type="submit" disabled={isSaving || uploading} className="w-full md:w-auto bg-primary text-on-primary font-bold px-8 py-3 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all text-[0.875rem] md:float-right disabled:opacity-50">
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

        {/* APPEARANCE SECTION */}
        <div className="pt-4">
          <h2 className="font-headline-md text-[1.5rem] text-on-surface">Appearance</h2>
          <p className="text-[0.875rem] text-on-surface-variant mt-1">Customize your study environment.</p>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-outline-variant/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {THEMES.map((theme) => (
              <button key={theme.id} onClick={() => changeTheme(theme.id)} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${currentTheme === theme.id ? 'border-primary bg-primary/10' : 'border-outline-variant/30 bg-surface-container-lowest hover:border-outline-variant'}`}>
                <span className={`font-bold text-[0.875rem] ${currentTheme === theme.id ? 'text-primary' : 'text-on-surface'}`}>{theme.name}</span>
                <div className="w-[1.5rem] h-[1.5rem] rounded-full border-2 border-on-surface/20 shadow-inner" style={{ background: `linear-gradient(135deg, ${theme.bg} 33%, ${theme.primary} 33% 66%, ${theme.secondary} 66%)` }}></div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* NEW: THE CROPPER MODAL OVERLAY */}
      {imageSrc && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md h-[60vh] bg-surface rounded-2xl overflow-hidden shadow-2xl">
            
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1} // Forces a perfect square!
              cropShape="round" // Gives the user a circle preview
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
            
            {/* Zoom Slider */}
            <div className="absolute bottom-20 left-0 right-0 px-8 flex items-center gap-4">
               <span className="material-symbols-outlined text-white text-[1.25rem] drop-shadow-md">zoom_out</span>
               <input
                 type="range" value={zoom} min={1} max={3} step={0.1}
                 aria-labelledby="Zoom"
                 onChange={(e) => setZoom(e.target.value)}
                 className="flex-1 accent-primary"
               />
               <span className="material-symbols-outlined text-white text-[1.25rem] drop-shadow-md">zoom_in</span>
            </div>

          </div>

          <div className="flex gap-4 mt-6">
            <button onClick={() => setImageSrc(null)} className="px-6 py-3 rounded-xl font-bold text-white bg-surface-container-highest hover:bg-surface-variant transition-all active:scale-95 text-[0.875rem]">
              Cancel
            </button>
            <button onClick={uploadCroppedImage} disabled={uploading} className="px-6 py-3 rounded-xl font-bold text-on-primary bg-primary transition-all active:scale-95 disabled:opacity-50 text-[0.875rem] shadow-lg shadow-primary/30">
              {uploading ? 'Processing...' : 'Save Photo'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}