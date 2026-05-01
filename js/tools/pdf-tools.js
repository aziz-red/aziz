window.pdfTools = [
    {
        id: 'merge-pdf',
        category: 'pdf',
        title: 'دمج PDF',
        description: 'اجمع عدة ملفات PDF في ملف واحد بسهولة.',
        icon: 'layers',
        renderUI: (container) => {
            const uploadArea = window.ui.createUploadArea(true, 'application/pdf', (files) => {
                handleFiles(files);
            });
            container.appendChild(uploadArea);

            const fileListContainer = document.createElement('div');
            fileListContainer.className = 'file-list';
            container.appendChild(fileListContainer);

            const controls = document.createElement('div');
            controls.innerHTML = `
                <button class="btn btn-primary" id="merge-btn" disabled style="margin-top: 20px;">
                    <i data-lucide="layers"></i> دمج وتحميل
                </button>
            `;
            container.appendChild(controls);

            let selectedFiles = [];

            function handleFiles(files) {
                Array.from(files).forEach(file => {
                    selectedFiles.push(file);
                });
                renderFileList();
            }

            function renderFileList() {
                fileListContainer.innerHTML = '';
                selectedFiles.forEach((file, index) => {
                    const item = document.createElement('div');
                    item.className = 'file-item';
                    item.innerHTML = `
                        <div class="file-info">
                            <i data-lucide="file-text" style="color: #ef4444;"></i>
                            <div class="file-name">${file.name}</div>
                            <div class="file-size">${window.ui.formatBytes(file.size)}</div>
                        </div>
                        <button class="remove-btn" data-index="${index}">
                            <i data-lucide="x"></i>
                        </button>
                    `;
                    fileListContainer.appendChild(item);
                });

                document.getElementById('merge-btn').disabled = selectedFiles.length < 2;
                
                // Add event listeners for remove buttons
                fileListContainer.querySelectorAll('.remove-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                        selectedFiles.splice(idx, 1);
                        renderFileList();
                    });
                });
                lucide.createIcons();
            }

            document.getElementById('merge-btn').addEventListener('click', async () => {
                if (selectedFiles.length < 2) return;
                
                const btn = document.getElementById('merge-btn');
                btn.innerHTML = '<div class="loader"></div> جاري الدمج...';
                btn.disabled = true;

                try {
                    const mergedPdf = await PDFLib.PDFDocument.create();
                    
                    for (const file of selectedFiles) {
                        const arrayBuffer = await file.arrayBuffer();
                        const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                        copiedPages.forEach((page) => mergedPdf.addPage(page));
                    }
                    
                    const mergedPdfFile = await mergedPdf.save();
                    const blob = new Blob([mergedPdfFile], { type: 'application/pdf' });
                    window.ui.downloadBlob(blob, 'merged.pdf');
                } catch (error) {
                    console.error(error);
                    alert("حدث خطأ أثناء دمج الملفات");
                } finally {
                    btn.innerHTML = '<i data-lucide="layers"></i> دمج وتحميل';
                    btn.disabled = false;
                    lucide.createIcons();
                }
            });
        }
    },
    {
        id: 'split-pdf',
        category: 'pdf',
        title: 'تقسيم PDF',
        description: 'استخراج صفحات معينة من ملف PDF.',
        icon: 'scissors',
        renderUI: (container) => {
            const uploadArea = window.ui.createUploadArea(false, 'application/pdf', (files) => {
                if (files[0]) handleFile(files[0]);
            });
            container.appendChild(uploadArea);

            const controls = document.createElement('div');
            controls.innerHTML = `
                <div class="control-group" style="margin-top: 20px;">
                    <label>الصفحات التي تريد استخراجها (مثال: 1, 3, 5-10):</label>
                    <input type="text" id="pages-input" placeholder="1-5, 8, 11-13">
                </div>
                <button class="btn btn-primary" id="split-btn" disabled style="margin-top: 20px;">
                    <i data-lucide="scissors"></i> استخراج وتحميل
                </button>
            `;
            container.appendChild(controls);

            let currentFile = null;

            function handleFile(file) {
                currentFile = file;
                document.getElementById('split-btn').disabled = false;
                uploadArea.querySelector('h3').textContent = `تم تحديد: ${file.name}`;
            }

            document.getElementById('split-btn').addEventListener('click', async () => {
                if (!currentFile) return;
                
                const pagesStr = document.getElementById('pages-input').value;
                if (!pagesStr.trim()) {
                    alert("الرجاء إدخال أرقام الصفحات!");
                    return;
                }

                try {
                    const arrayBuffer = await currentFile.arrayBuffer();
                    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
                    const totalPages = pdfDoc.getPageCount();

                    // Parse ranges
                    let indices = [];
                    const parts = pagesStr.split(',');
                    for (const part of parts) {
                        const t = part.trim();
                        if (t.includes('-')) {
                            const [start, end] = t.split('-').map(Number);
                            for (let i = start; i <= end; i++) indices.push(i - 1);
                        } else {
                            indices.push(Number(t) - 1);
                        }
                    }

                    // Validate
                    indices = indices.filter(i => !isNaN(i) && i >= 0 && i < totalPages);
                    if (indices.length === 0) {
                        alert("أرقام صفحات غير صالحة!");
                        return;
                    }

                    const newPdf = await PDFLib.PDFDocument.create();
                    const copiedPages = await newPdf.copyPages(pdfDoc, indices);
                    copiedPages.forEach(page => newPdf.addPage(page));

                    const pdfBytes = await newPdf.save();
                    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                    window.ui.downloadBlob(blob, `split_${currentFile.name}`);
                    
                } catch (error) {
                    console.error(error);
                    alert("حدث خطأ أثناء المعالجة!");
                }
            });
        }
    },
    {
        id: 'protect-pdf',
        category: 'pdf',
        title: 'حماية PDF',
        description: 'إضافة كلمة سر لملف الـ PDF الخاص بك.',
        icon: 'lock',
        renderUI: (container) => {
            const uploadArea = window.ui.createUploadArea(false, 'application/pdf', (files) => {
                if (files[0]) handleFile(files[0]);
            });
            container.appendChild(uploadArea);

            const controls = document.createElement('div');
            controls.innerHTML = `
                <div class="control-group" style="margin-top: 20px;">
                    <label>كلمة السر:</label>
                    <input type="text" id="pdf-password" placeholder="أدخل كلمة السر هنا">
                </div>
                <button class="btn btn-primary" id="protect-btn" disabled style="margin-top: 20px;">
                    <i data-lucide="lock"></i> حماية وتحميل
                </button>
            `;
            container.appendChild(controls);

            let currentFile = null;

            function handleFile(file) {
                currentFile = file;
                document.getElementById('protect-btn').disabled = false;
                uploadArea.querySelector('h3').textContent = `تم تحديد: ${file.name}`;
            }

            document.getElementById('protect-btn').addEventListener('click', async () => {
                if (!currentFile) return;
                const password = document.getElementById('pdf-password').value;
                if (!password) {
                    alert("الرجاء إدخال كلمة سر!");
                    return;
                }

                try {
                    const arrayBuffer = await currentFile.arrayBuffer();
                    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
                    
                    const pdfBytes = await pdfDoc.save({
                        useObjectStreams: false,
                        userPassword: password,
                        ownerPassword: password,
                        permissions: {
                            printing: 'highResolution',
                            modifying: false,
                            copying: false,
                        },
                    });

                    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                    window.ui.downloadBlob(blob, `protected_${currentFile.name}`);
                } catch (error) {
                    console.error(error);
                    alert("حدث خطأ أثناء إضافة كلمة السر");
                }
            });
        }
    },
    {
        id: 'image-to-pdf',
        category: 'pdf',
        title: 'صورة إلى PDF',
        description: 'تحويل الصور (JPG, PNG) إلى ملف PDF.',
        icon: 'image',
        renderUI: (container) => {
            const uploadArea = window.ui.createUploadArea(true, 'image/*', (files) => {
                handleFiles(files);
            });
            container.appendChild(uploadArea);

            const fileListContainer = document.createElement('div');
            fileListContainer.className = 'file-list';
            container.appendChild(fileListContainer);

            const controls = document.createElement('div');
            controls.innerHTML = `
                <button class="btn btn-primary" id="convert-pdf-btn" disabled style="margin-top: 20px;">
                    <i data-lucide="file-down"></i> تحويل إلى PDF
                </button>
            `;
            container.appendChild(controls);

            let selectedFiles = [];

            function handleFiles(files) {
                Array.from(files).forEach(file => {
                    selectedFiles.push(file);
                });
                renderFileList();
            }

            function renderFileList() {
                fileListContainer.innerHTML = '';
                selectedFiles.forEach((file, index) => {
                    const item = document.createElement('div');
                    item.className = 'file-item';
                    item.innerHTML = `
                        <div class="file-info">
                            <i data-lucide="image" style="color: var(--primary-color);"></i>
                            <div class="file-name">${file.name}</div>
                        </div>
                        <button class="remove-btn" data-index="${index}">
                            <i data-lucide="x"></i>
                        </button>
                    `;
                    fileListContainer.appendChild(item);
                });

                document.getElementById('convert-pdf-btn').disabled = selectedFiles.length === 0;
                
                fileListContainer.querySelectorAll('.remove-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                        selectedFiles.splice(idx, 1);
                        renderFileList();
                    });
                });
                lucide.createIcons();
            }

            document.getElementById('convert-pdf-btn').addEventListener('click', async () => {
                if (selectedFiles.length === 0) return;
                
                const btn = document.getElementById('convert-pdf-btn');
                btn.innerHTML = '<div class="loader"></div> جاري التحويل...';
                btn.disabled = true;

                try {
                    const pdfDoc = await PDFLib.PDFDocument.create();
                    
                    for (const file of selectedFiles) {
                        const arrayBuffer = await file.arrayBuffer();
                        let image;
                        if (file.type === 'image/jpeg') {
                            image = await pdfDoc.embedJpg(arrayBuffer);
                        } else if (file.type === 'image/png') {
                            image = await pdfDoc.embedPng(arrayBuffer);
                        } else {
                            continue; // Skip unsupported for now
                        }
                        
                        const page = pdfDoc.addPage([image.width, image.height]);
                        page.drawImage(image, {
                            x: 0,
                            y: 0,
                            width: image.width,
                            height: image.height,
                        });
                    }
                    
                    const pdfBytes = await pdfDoc.save();
                    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                    window.ui.downloadBlob(blob, 'images_converted.pdf');
                } catch (error) {
                    console.error(error);
                    alert("حدث خطأ أثناء تحويل الصور");
                } finally {
                    btn.innerHTML = '<i data-lucide="file-down"></i> تحويل إلى PDF';
                    btn.disabled = false;
                    lucide.createIcons();
                }
            });
        }
    },
    {
        id: 'pdf-to-image',
        category: 'pdf',
        title: 'PDF إلى صور',
        description: 'استخراج كل صفحات الـ PDF كصور.',
        icon: 'images',
        renderUI: (container) => {
            const uploadArea = window.ui.createUploadArea(false, 'application/pdf', (files) => {
                if (files[0]) handleFile(files[0]);
            });
            container.appendChild(uploadArea);

            const controls = document.createElement('div');
            controls.innerHTML = `
                <button class="btn btn-primary" id="extract-img-btn" disabled style="margin-top: 20px;">
                    <i data-lucide="images"></i> استخراج الصور كملف مضغوط (ZIP)
                </button>
            `;
            container.appendChild(controls);

            let currentFile = null;

            function handleFile(file) {
                currentFile = file;
                document.getElementById('extract-img-btn').disabled = false;
                uploadArea.querySelector('h3').textContent = `تم تحديد: ${file.name}`;
            }

            document.getElementById('extract-img-btn').addEventListener('click', async () => {
                if (!currentFile) return;
                
                const btn = document.getElementById('extract-img-btn');
                btn.innerHTML = '<div class="loader"></div> جاري الاستخراج...';
                btn.disabled = true;

                try {
                    const arrayBuffer = await currentFile.arrayBuffer();
                    const typedarray = new Uint8Array(arrayBuffer);
                    
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    const zip = new JSZip();

                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const viewport = page.getViewport({ scale: 2.0 }); // High res
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
                        
                        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
                        zip.file(`page_${i}.jpg`, blob);
                    }

                    const zipBlob = await zip.generateAsync({ type: 'blob' });
                    window.ui.downloadBlob(zipBlob, `${currentFile.name.replace('.pdf', '')}_images.zip`);

                } catch (error) {
                    console.error(error);
                    alert("حدث خطأ أثناء استخراج الصور");
                } finally {
                    btn.innerHTML = '<i data-lucide="images"></i> استخراج الصور كملف مضغوط (ZIP)';
                    btn.disabled = false;
                    lucide.createIcons();
                }
            });
        }
    }
];
