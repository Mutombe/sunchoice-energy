"""Converts the raw brand / old-site images into named, web-ready WebP files.
Usage: python images.py <brand_dir> <oldsite_dir> <out_dir>"""
import sys, os
from PIL import Image, ImageFile, ImageOps
ImageFile.LOAD_TRUNCATED_IMAGES = True
brand, old, out = sys.argv[1:4]

B = {  # brand folder -> semantic name
 '1-1.png':'commercial-fitment-roof','1.-Listicle-Solar-is-awesome-1024x683.jpg':'ground-mount-grass',
 '2-1.png':'metal-roof-array','6a5ab63d619cea6270943999_Property Developer Finance jpg.jpg':'housing-development',
 'SNAP_NEW_LANDING_PAGE_BANNER_MAR2018.jpg':'aerial-suburbs','Untitled-711-x-450-px-4.png':'tiled-roof-home',
 'a690ab84-4d48-41d8-84ca-a9675dda0f43.jpg':'harare-skyline','electric-farm-with-panels-producing-clean-ecologic-energy-1024x683.jpg':'solar-farm-reeds',
 'image-up.png':'installer-drill','images (2).jpg':'sunset-wheat-array','istockphoto-1130758764-2048x2048.jpg':'string-inverters-field',
 'istockphoto-1197590704-2048x2048.jpg':'inverter-plant-room','istockphoto-1302659815-612x612.jpg':'harare-cbd',
 'istockphoto-1362872948-2048x2048.jpg':'home-cottage-solar','istockphoto-1402475274-2048x2048.jpg':'agri-lettuce-array',
 'istockphoto-1448607390-2048x2048.jpg':'technician-roof-valley','istockphoto-1462151309-2048x2048.jpg':'hands-seedling-together',
 'istockphoto-1463617670-2048x2048.jpg':'engineers-wind-sunset','istockphoto-1490061322-2048x2048.jpg':'hybrid-inverter-panel',
 'istockphoto-1620576275-2048x2048.jpg':'home-battery-wall','istockphoto-1676495583-2048x2048.jpg':'agri-canopy-vines',
 'istockphoto-1718847029-2048x2048.jpg':'vineyard-array','istockphoto-1742670724-2048x2048.jpg':'wall-inverter-battery',
 'istockphoto-1999953241-2048x2048.jpg':'community-cycling','istockphoto-2045558460-2048x2048.jpg':'hands-seedling',
 'istockphoto-2160078175-2048x2048.jpg':'community-garden','istockphoto-2162813543-2048x2048.jpg':'tracker-closeup',
 'istockphoto-2172501561-2048x2048.jpg':'bess-containers','istockphoto-2199726093-2048x2048.jpg':'green-facade',
 'istockphoto-2209090636-2048x2048.jpg':'installer-sunset','istockphoto-2211089749-2048x2048.jpg':'exterior-inverter',
 'istockphoto-2214926216-2048x2048.jpg':'consultant-office','istockphoto-2220243310-2048x2048.jpg':'team-huddle',
 'istockphoto-2222813649-2048x2048.jpg':'array-in-trees','istockphoto-2230159460-2048x2048.jpg':'team-warehouse',
 'istockphoto-2231745593-2048x2048.jpg':'field-blue-sky','istockphoto-2233448310-2048x2048.jpg':'green-tower-up',
 'istockphoto-2246916593-2048x2048.jpg':'sunset-rows','istockphoto-2254411341-2048x2048.jpg':'home-roof-sunset',
 'istockphoto-2260659216-2048x2048.jpg':'sun-flare','istockphoto-2269681156-2048x2048.jpg':'leader-world-map',
 'istockphoto-2271995989-2048x2048.jpg':'battery-cabinet','istockphoto-2286461738-2048x2048.jpg':'technician-inspect',
 'istockphoto-2294102962-2048x2048.jpg':'battery-rack','istockphoto-909265570-2048x2048.jpg':'inverters-under-array',
 'solar-power-field-1024x701.jpg':'field-green','vTgfLwZ.jpeg':'eco-lodge',
}
O = {  # old site -> real Sunchoice project photos
 '2C6140D7-732D-4C06-B744-AE5D9FEC8474-scaled.jpeg':'proj-night-install','IMG_4659-2.png':'proj-residence-pool',
 'IMG_6341-1.png':'proj-panel-cleaning','IMG_9208.png':'proj-houseboat-kariba','Kingdom-Style-Pictures-1-21.png':'proj-crew-batteries',
 'Kingdom-Style-Pictures-10-scaled.jpg':'proj-roof-crew-a','Kingdom-Style-Pictures-11-scaled.jpg':'proj-roof-crew-b',
 'Kingdom-Style-Pictures-15-scaled.jpg':'proj-aerial-a','Kingdom-Style-Pictures-17-scaled.jpg':'proj-aerial-b',
 'Kingdom-Style-Pictures-19-scaled.jpg':'proj-aerial-c','Kingdom-Style-Pictures-20-scaled.jpg':'proj-aerial-d',
 'Kingdom-Style-Pictures-3-scaled.jpg':'proj-roof-install','Kingdom-Style-Pictures-6.png':'proj-roof-progress',
 'Kingdom-Style-Pictures-scaled.jpg':'proj-roof-wide',
}
L = {'9350f7_29095415950a470883275fba8a88fd65mv2.png':'sunsynk','Screenshot-2024-03-18-115933.png':'pylontech',
     'Screenshot_2024-03-18_115851-removebg-preview.png':'deye','download-1.png':'phocos','download.png':'victron',
     'fronius-logo-PVGroup.pl_-e1710756906223.png':'fronius','whatsapp-image-2020-12-25-at-09.53.47.jpeg':'jinko'}

def save(im, name, big=1800, small=820):
    im = ImageOps.exif_transpose(im).convert('RGB')
    for suffix, w in (('', big), ('-sm', small)):
        c = im.copy()
        if c.width > w: c = c.resize((w, round(c.height * w / c.width)), Image.LANCZOS)
        c.save(os.path.join(out, name + suffix + '.webp'), 'WEBP', quality=80, method=6)

for src, m in ((brand, B), (old, O)):
    for f, n in m.items():
        save(Image.open(os.path.join(src, f)), n); print('ok', n)

os.makedirs(os.path.join(out, 'partners'), exist_ok=True)
for f, n in L.items():  # grayscale, white knocked out to transparent, tight crop
    im = Image.open(os.path.join(old, f)).convert('RGBA')
    g = ImageOps.grayscale(im)
    alpha = Image.eval(g, lambda v: 0 if v > 235 else min(255, (255 - v) * 2))
    a0 = im.getchannel('A'); alpha = Image.fromarray(__import__('numpy').minimum(__import__('numpy').array(alpha), __import__('numpy').array(a0)))
    ink = Image.new('RGBA', im.size, (24, 30, 42, 255)); ink.putalpha(alpha)
    ink = ink.crop(alpha.getbbox())
    ink.thumbnail((360, 120), Image.LANCZOS)
    ink.save(os.path.join(out, 'partners', n + '.png')); print('logo', n)
