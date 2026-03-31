import sys
import os

target_file = r"c:\Users\Amor\Desktop\WondarEthiopia\wonderethiopia\app\business\dashboard\page.tsx"
with open(target_file, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    line_no = i + 1
    # Replace label and first div
    if 657 <= line_no <= 685:
        if line_no == 657:
            indent = line[:line.find("<")]
            new_lines.append(f'{indent}<div className="md:col-span-2 space-y-4">\n')
            new_lines.append(f'{indent}   <div className="flex items-center justify-between px-4">\n')
            new_lines.append(f'{indent}      <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Institutional Portfolio (Up to 10 Images)</label>\n')
            new_lines.append(f'{indent}      <span className="text-[9px] font-black text-primary uppercase">{{serviceForm.images.length}}/10 Assets</span>\n')
            new_lines.append(f'{indent}   </div>\n')
            new_lines.append(f'{indent}   \n')
            new_lines.append(f'{indent}   <div className="flex items-center gap-6">\n')
            new_lines.append(f'{indent}      <input \n')
            new_lines.append(f'{indent}        type="file" \n')
            new_lines.append(f'{indent}        id="service-assets" \n')
            new_lines.append(f'{indent}        multiple \n')
            new_lines.append(f'{indent}        accept="image/*" \n')
            new_lines.append(f'{indent}        className="hidden" \n')
            new_lines.append(f'{indent}        onChange={{handleServiceAssetUpload}} \n')
            new_lines.append(f'{indent}      />\n')
            new_lines.append(f'{indent}      <label \n')
            new_lines.append(f'{indent}        htmlFor="service-assets" \n')
            new_lines.append(f'{indent}        className={{`px-10 py-5 bg-foreground text-background rounded-3xl text-[10px] font-bold uppercase transition-all flex items-center gap-4 cursor-pointer hover:bg-primary ${{serviceForm.images.length >= 10 ? "opacity-30 cursor-not-allowed pointer-events-none" : "shadow-xl shadow-black/10"}}`}}\n')
            new_lines.append(f'{indent}      >\n')
            new_lines.append(f'{indent}         {{isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Camera className="w-4 h-4"/>}}\n')
            new_lines.append(f'{indent}         {{isUploading ? "Uploading visual assets..." : "Sync Portfolio Images"}}\n')
            new_lines.append(f'{indent}      </label>\n')
            new_lines.append(f'{indent}      <p className="text-[9px] font-bold text-foreground/20 italic max-w-[200px]">\n')
            new_lines.append(f'{indent}         Select professional JPG/PNG images to represent this service.\n')
            new_lines.append(f'{indent}      </p>\n')
            new_lines.append(f'{indent}   </div>\n')
        continue
    # Replace second div (map)
    if 686 <= line_no <= 698:
        if line_no == 686:
            indent = line[:line.find("<")]
            new_lines.append(f'\n{indent}   <div className="flex flex-wrap gap-6 mt-10 p-8 border-2 border-dashed border-foreground/5 rounded-[40px] bg-foreground/[0.01]">\n')
            new_lines.append(f'{indent}      {{serviceForm.images.length === 0 ? (\n')
            new_lines.append(f'{indent}         <div className="w-full text-center py-20 animate-pulse">\n')
            new_lines.append(f'{indent}            <Plus className="w-10 h-10 text-foreground/5 mx-auto mb-6" />\n')
            new_lines.append(f'{indent}            <p className="text-[10px] font-black text-foreground/10 uppercase tracking-widest">No assets synchronized</p>\n')
            new_lines.append(f'{indent}         </div>\n')
            new_lines.append(f'{indent}      ) : (\n')
            new_lines.append(f'{indent}         serviceForm.images.map((img: string, i: number) => (\n')
            new_lines.append(f'{indent}           <div key={{i}} className="relative group w-32 h-32 rounded-3xl overflow-hidden border border-foreground/5 shadow-inner">\n')
            new_lines.append(f'{indent}              <img src={{img}} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Service" />\n')
            new_lines.append(f'{indent}              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">\n')
            new_lines.append(f'{indent}                 <button \n')
            new_lines.append(f'{indent}                   type="button" \n')
            new_lines.append(f'{indent}                   onClick={{() => setServiceForm({{...serviceForm, images: serviceForm.images.filter((_:any, idx:number) => idx !== i)}})}}\n')
            new_lines.append(f'{indent}                   className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center hover:bg-red-600 transition-all shadow-xl"\n')
            new_lines.append(f'{indent}                 >\n')
            new_lines.append(f'{indent}                    <Trash2 className="w-5 h-5" />\n')
            new_lines.append(f'{indent}                 </button>\n')
            new_lines.append(f'{indent}              </div>\n')
            new_lines.append(f'{indent}              <div className="absolute top-3 left-3 w-6 h-6 rounded-lg glass text-[9px] font-black flex items-center justify-center text-white">\n')
            new_lines.append(f'{indent}                 {{i + 1}}\n')
            new_lines.append(f'{indent}              </div>\n')
            new_lines.append(f'{indent}           </div>\n')
            new_lines.append(f'{indent}         ))\n')
            new_lines.append(f'{indent}      )}}\n')
            new_lines.append(f'{indent}   </div>\n')
        continue
    new_lines.append(line)

with open(target_file, "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("Replacement successful")
