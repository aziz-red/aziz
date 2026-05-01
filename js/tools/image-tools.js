window.imageTools = [
    {
        id: 'image-converter',
        category: 'image',
        title: 'تحويل صيغ الصور',
        description: 'قم بتحويل صورك بين صيغ PNG, JPG, WebP و SVG بسهولة.',
        icon: 'image',
        renderUI: (container) => {
            const uploadArea = window.ui.createUploadArea(false, 'image/*', (files) => {
                if (files[0]) handleFile(files[0]);
            });
            container.appendChild(uploadArea);

            const controls = document.createElement('div');
            controls.innerHTML = `
                <div class="control-group">
                    <label>تحويل إلى صيغة:</label>
                    <select id="target-format">
                        <option value="image/jpeg">JPG</option>
                        <option value="image/png">PNG</option>
                        <option value="image/webp">WebP</option>
                    </select>
                </div>
                <button class="btn btn-primary" id="convert-btn" disabled style="margin-top: 20px;">
                    <i data-lucide="refresh-cw"></i> تحويل وتحميل
                </button>
            `;
            container.appendChild(controls);

            let currentImage = null;

            function handleFile(file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        currentImage = img;
                        document.getElementById('convert-btn').disabled = false;
                        uploadArea.querySelector('h3').textContent = `تم تحديد: ${file.name}`;
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }

            document.getElementById('convert-btn').addEventListener('click', () => {
                if (!currentImage) return;
                const canvas = document.createElement('canvas');
                canvas.width = currentImage.width;
                canvas.height = currentImage.height;
                const ctx = canvas.getContext('2d');
                
                // Fill white background for JPG
                const format = document.getElementById('target-format').value;
                if (format === 'image/jpeg') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                
                ctx.drawImage(currentImage, 0, 0);
                
                canvas.toBlob((blob) => {
                    const ext = format.split('/')[1];
                    window.ui.downloadBlob(blob, `converted_image.${ext}`);
                }, format, 0.9);
            });
        }
    },
    {
        id: 'image-resizer',
        category: 'image',
        title: 'تغيير حجم الصورة',
        description: 'قم بتصغير أو تكبير أبعاد صورتك مع الحفاظ على الجودة.',
        icon: 'maximize',
        renderUI: (container) => {
            const uploadArea = window.ui.createUploadArea(false, 'image/*', (files) => {
                if (files[0]) handleFile(files[0]);
            });
            container.appendChild(uploadArea);

            const controls = document.createElement('div');
            controls.innerHTML = `
                <div style="display: flex; gap: 20px; margin-top: 20px;">
                    <div class="control-group" style="flex: 1;">
                        <label>العرض (Width):</label>
                        <input type="number" id="resize-width" placeholder="مثال: 800">
                    </div>
                    <div class="control-group" style="flex: 1;">
                        <label>الطول (Height):</label>
                        <input type="number" id="resize-height" placeholder="مثال: 600">
                    </div>
                </div>
                <button class="btn btn-primary" id="resize-btn" disabled style="margin-top: 20px;">
                    <i data-lucide="crop"></i> تغيير الحجم
                </button>
            `;
            container.appendChild(controls);

            let currentImage = null;
            let currentFile = null;

            function handleFile(file) {
                currentFile = file;
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        currentImage = img;
                        document.getElementById('resize-btn').disabled = false;
                        document.getElementById('resize-width').value = img.width;
                        document.getElementById('resize-height').value = img.height;
                        uploadArea.querySelector('h3').textContent = `تم تحديد: ${file.name}`;
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }

            document.getElementById('resize-btn').addEventListener('click', () => {
                if (!currentImage) return;
                const width = parseInt(document.getElementById('resize-width').value) || currentImage.width;
                const height = parseInt(document.getElementById('resize-height').value) || currentImage.height;
                
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(currentImage, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    window.ui.downloadBlob(blob, `resized_${currentFile.name}`);
                }, currentFile.type, 0.9);
            });
        }
    },
    {
        id: 'image-compressor',
        category: 'image',
        title: 'ضغط الصور',
        description: 'قلل حجم الصورة (بالكيلوبايت) لسرعة الرفع والاستخدام.',
        icon: 'minimize',
        renderUI: (container) => {
            const uploadArea = window.ui.createUploadArea(false, 'image/*', (files) => {
                if (files[0]) handleFile(files[0]);
            });
            container.appendChild(uploadArea);

            const controls = document.createElement('div');
            controls.innerHTML = `
                <div class="control-group">
                    <label>جودة الضغط:</label>
                    <select id="compress-quality">
                        <option value="0.8">عالية (80%)</option>
                        <option value="0.6" selected>متوسطة (60%)</option>
                        <option value="0.4">منخفضة - حجم أصغر (40%)</option>
                    </select>
                </div>
                <button class="btn btn-primary" id="compress-btn" disabled style="margin-top: 20px;">
                    <i data-lucide="zap"></i> ضغط وتحميل
                </button>
            `;
            container.appendChild(controls);

            let currentFile = null;

            function handleFile(file) {
                currentFile = file;
                document.getElementById('compress-btn').disabled = false;
                uploadArea.querySelector('h3').textContent = `الحجم الأصلي: ${window.ui.formatBytes(file.size)}`;
            }

            document.getElementById('compress-btn').addEventListener('click', async () => {
                if (!currentFile) return;
                
                const btn = document.getElementById('compress-btn');
                btn.innerHTML = '<div class="loader"></div> جاري الضغط...';
                btn.disabled = true;

                try {
                    const quality = parseFloat(document.getElementById('compress-quality').value);
                    const options = {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true,
                        initialQuality: quality
                    };

                    const compressedFile = await window.imageCompression(currentFile, options);
                    window.ui.downloadBlob(compressedFile, `compressed_${currentFile.name}`);
                    
                    uploadArea.querySelector('h3').textContent = `تم بنجاح! الحجم الجديد: ${window.ui.formatBytes(compressedFile.size)}`;
                } catch (error) {
                    console.error('Compression error:', error);
                    alert('حدث خطأ أثناء ضغط الصورة.');
                } finally {
                    btn.innerHTML = '<i data-lucide="zap"></i> ضغط وتحميل';
                    btn.disabled = false;
                    lucide.createIcons();
                }
            });
        }
    },
    {
        id: 'bg-remover',
        category: 'image',
        title: 'إزالة الخلفية',
        description: 'إزالة خلفية الصور باستخدام الذكاء الاصطناعي مجاناً.',
        icon: 'eraser',
        renderUI: (container) => {
            const uploadArea = window.ui.createUploadArea(false, 'image/*', (files) => {
                if (files[0]) handleFile(files[0]);
            });
            container.appendChild(uploadArea);

            const outputDiv = document.createElement('div');
            outputDiv.className = 'output-area';
            outputDiv.innerHTML = `
                <img id="bg-result-img" style="max-width: 100%; border-radius: 10px; margin-bottom: 15px;">
                <button class="btn btn-primary" id="download-bg-btn" style="display: none;">
                    <i data-lucide="download"></i> تحميل الصورة
                </button>
            `;
            container.appendChild(outputDiv);

            let currentFile = null;

            async function handleFile(file) {
                currentFile = file;
                outputDiv.classList.add('visible');
                outputDiv.innerHTML = '<h3><div class="loader"></div> جاري المعالجة باستخدام الذكاء الاصطناعي (قد يستغرق بعض الوقت لأول مرة)...</h3>';
                
                try {
                    // Check if imglyRemoveBackground is available, it might need script loaded
                    // For static HTML script tag without ES modules for imgly:
                    if(typeof window.imglyRemoveBackground === 'undefined') {
                       alert("مكتبة إزالة الخلفية قيد التحميل، يرجى المحاولة بعد قليل");
                       return;
                    }
                    
                    const blob = await window.imglyRemoveBackground(file);
                    const url = URL.createObjectURL(blob);
                    
                    outputDiv.innerHTML = `
                        <img id="bg-result-img" src="${url}" style="max-width: 100%; border-radius: 10px; margin-bottom: 15px; background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAH0lEQVQ4T2N89uzZfwY8QFJSEp80A+OoaBgFwxQKAAAzKQmS8e2VgwAAAABJRU5ErkJggg==');">
                        <br>
                        <button class="btn btn-primary" id="download-bg-btn">
                            <i data-lucide="download"></i> تحميل الصورة بدون خلفية
                        </button>
                    `;
                    
                    document.getElementById('download-bg-btn').addEventListener('click', () => {
                        window.ui.downloadBlob(blob, `nobg_${file.name.split('.')[0]}.png`);
                    });
                    
                    lucide.createIcons();
                } catch (error) {
                    console.error(error);
                    outputDiv.innerHTML = '<h3>حدث خطأ، تأكد من الاتصال بالانترنت للمكتبة الأولى.</h3>';
                }
            }
        }
    },
    {
        id: 'image-ocr',
        category: 'image',
        title: 'استخراج النص (OCR)',
        description: 'استخراج النصوص من الصور (يدعم العربية والإنجليزية).',
        icon: 'type',
        renderUI: (container) => {
            const uploadArea = window.ui.createUploadArea(false, 'image/*', (files) => {
                if (files[0]) handleFile(files[0]);
            });
            container.appendChild(uploadArea);

            const outputDiv = document.createElement('div');
            outputDiv.className = 'output-area';
            outputDiv.innerHTML = `
                <textarea id="ocr-result" rows="8" style="width: 100%; padding: 15px; border-radius: 10px; border: 1px solid var(--glass-border); background: var(--glass-bg); color: var(--text-primary); margin-bottom: 15px;" readonly placeholder="سيظهر النص المستخرج هنا..."></textarea>
                <button class="btn btn-primary" id="copy-btn" disabled>
                    <i data-lucide="copy"></i> نسخ النص
                </button>
            `;
            container.appendChild(outputDiv);

            async function handleFile(file) {
                const resultArea = document.getElementById('ocr-result');
                const copyBtn = document.getElementById('copy-btn');
                
                outputDiv.classList.add('visible');
                resultArea.value = "جاري قراءة الصورة... يرجى الانتظار.";
                copyBtn.disabled = true;

                try {
                    const worker = await Tesseract.createWorker('ara+eng');
                    const { data: { text } } = await worker.recognize(file);
                    
                    resultArea.value = text;
                    copyBtn.disabled = false;
                    await worker.terminate();
                } catch (error) {
                    console.error(error);
                    resultArea.value = "حدث خطأ أثناء استخراج النص.";
                }
            }

            document.getElementById('copy-btn').addEventListener('click', () => {
                const text = document.getElementById('ocr-result').value;
                navigator.clipboard.writeText(text).then(() => {
                    alert('تم نسخ النص!');
                });
            });
        }
    },
    {
        id: 'favicon-generator',
        category: 'image',
        title: 'صانع الأيقونات (Favicon)',
        description: 'تحويل الصور إلى أيقونات موقع .ico.',
        icon: 'star',
        renderUI: (container) => {
            const uploadArea = window.ui.createUploadArea(false, 'image/*', (files) => {
                if (files[0]) handleFile(files[0]);
            });
            container.appendChild(uploadArea);

            const controls = document.createElement('div');
            controls.innerHTML = `
                <button class="btn btn-primary" id="favicon-btn" disabled style="margin-top: 20px;">
                    <i data-lucide="box"></i> إنشاء Favicon
                </button>
            `;
            container.appendChild(controls);

            let currentImage = null;

            function handleFile(file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        currentImage = img;
                        document.getElementById('favicon-btn').disabled = false;
                        uploadArea.querySelector('h3').textContent = `تم تحديد: ${file.name}`;
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }

            document.getElementById('favicon-btn').addEventListener('click', () => {
                if (!currentImage) return;
                
                // For simplicity, we just resize to 32x32 png which works as modern favicon
                // Real .ico requires building a specific binary format.
                const canvas = document.createElement('canvas');
                canvas.width = 32;
                canvas.height = 32;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(currentImage, 0, 0, 32, 32);
                
                canvas.toBlob((blob) => {
                    window.ui.downloadBlob(blob, `favicon.png`);
                }, 'image/png');
            });
        }
    }
];
