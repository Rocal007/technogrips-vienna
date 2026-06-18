import os
import time
import glob
import rawpy
from PIL import Image
from concurrent.futures import ThreadPoolExecutor, as_completed

src_dir = r"H:\DCIM\111_PANA"
dst_dir = r"E:\technogrips-vienna\CAM_SD_media"
max_width = 1980

def convert_single(src_path, dst_path):
    try:
        with rawpy.imread(src_path) as raw:
            rgb = raw.postprocess(use_camera_wb=True)
        img = Image.fromarray(rgb)
        width, height = img.size
        
        if width > max_width:
            ratio = max_width / float(width)
            new_height = int(float(height) * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            
        img.save(dst_path, "WEBP", quality=85)
        return True, src_path, None
    except Exception as e:
        return False, src_path, str(e)

if __name__ == "__main__":
    if not os.path.exists(dst_dir):
        os.makedirs(dst_dir)
        
    raw_files = glob.glob(os.path.join(src_dir, "*.[rR][wW]2"))
    total_files = len(raw_files)
    print(f"Found {total_files} RW2 files.")
    
    if not raw_files:
        print("No files to convert.")
        exit(0)
        
    # Filter files that are already converted
    files_to_convert = []
    skipped_count = 0
    for f in raw_files:
        base_name = os.path.splitext(os.path.basename(f))[0]
        dst_path = os.path.join(dst_dir, base_name + ".webp")
        if os.path.exists(dst_path) and os.path.getsize(dst_path) > 0:
            skipped_count += 1
        else:
            files_to_convert.append(f)
            
    print(f"Skipped {skipped_count} already converted files. {len(files_to_convert)} files left to convert.")
    
    if not files_to_convert:
        print("All files are already converted.")
        exit(0)
        
    start_time = time.time()
    completed = skipped_count
    errors = []
    
    # Using 6 threads on an 8-core CPU
    num_workers = 6
    print(f"Starting conversion of {len(files_to_convert)} files using {num_workers} threads...")
    
    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        futures = {}
        for f in files_to_convert:
            base_name = os.path.splitext(os.path.basename(f))[0]
            dst_path = os.path.join(dst_dir, base_name + ".webp")
            future = executor.submit(convert_single, f, dst_path)
            futures[future] = f
            
        for future in as_completed(futures):
            success, src_path, err = future.result()
            completed += 1
            if success:
                print(f"[{completed}/{total_files}] Converted {os.path.basename(src_path)}")
            else:
                print(f"[{completed}/{total_files}] Failed {os.path.basename(src_path)}: {err}")
                errors.append((src_path, err))
                
    elapsed = time.time() - start_time
    print(f"\nFinished! Converted {completed - skipped_count - len(errors)} files in {elapsed:.2f} seconds ({elapsed/60.0:.2f} minutes).")
    if errors:
        print(f"Encountered {len(errors)} errors:")
        for path, err in errors:
            print(f"  - {os.path.basename(path)}: {err}")
