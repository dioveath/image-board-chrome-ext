console.log("content.js loaded");

const inputImages = document.querySelectorAll('input[type="file"][accept="image/*"]');

const backDrop = document.createElement('div');
backDrop.style.position = 'fixed';
backDrop.style.width = '100%';
backDrop.style.height = '100%';
backDrop.style.backgroundColor = 'rgba(0,0,0,0.5)';
backDrop.style.zIndex = '999';
backDrop.id = 'backDrop';

const imageBoard = document.createElement('div');
imageBoard.style.width = '400px';
imageBoard.style.height = '200px';
imageBoard.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
imageBoard.style.zIndex = '999';
imageBoard.id = 'imageBoard';


inputImages.forEach(inputImage => {
    inputImage.addEventListener('click', async (event) => {
        if(isImageBoardOpen()) {
            imageBoard.remove();
            backDrop.remove();
            return;
        }

        event.preventDefault();

        imageBoard.style.position = 'absolute';
        imageBoard.style.top = Math.max(0, Math.min(event.clientY, window.innerHeight - 200)) + 'px';
        imageBoard.style.left = Math.max(0, Math.min(event.clientX, window.innerWidth - 400)) + 'px';

        backDrop.style.position = 'fixed';
        backDrop.style.width = '100%';
        backDrop.style.height = '100%';
        backDrop.style.backgroundColor = 'rgba(0,0,0,0.5)';
        backDrop.style.zIndex = '999';
        backDrop.style.top = '0';
        backDrop.style.left = '0';
        backDrop.id = 'backDrop';

        initializeImageBoard(imageBoard, event);

        document.body.appendChild(backDrop);
        document.body.appendChild(imageBoard);
    });

    inputImage.addEventListener('change', (event) => {
        console.log('ImageBoard input change');
        if(isImageBoardOpen()) {
            imageBoard.remove();
            backDrop.remove();
        }

        // storage the change in the local storage
        const file = event.target.files[0];

        // serialize the file to base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result;

            chrome.storage.local.set({ 'recentImage': base64 }, () => {
                console.log('ImageBoard storage updated');
            });
        };

        reader.onerror = (error) => {
            console.log('Error: ', error);
        };

    });

});



async function initializeImageBoard(imageBoard, inputImageEvent) {
    imageBoard.innerHTML = '';

    const imagesList = document.createElement('ul');
    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
            for (const type of item.types) {
                if (type.startsWith('image/') === false) continue;
                const blob = await item.getType(type);
                const dataUrl = URL.createObjectURL(blob);

                const imageCard = document.createElement('img');
                imageCard.src = dataUrl;
                imageCard.style.width = '100px';
                imageCard.style.height = '100px';
                imageCard.style.objectFit = 'cover';

                imageCard.addEventListener('click', (event) => {
                    const fileType = type.split('/')[1];
                    const file = new File([blob], `image_board_temp_${Date.now()}.${fileType}`, { type: type, lastModified: Date.now() });

                    const data = new DataTransfer();
                    data.items.add(file);

                    inputImageEvent.target.files = data.files;
                    inputImageEvent.target.dispatchEvent(new Event('change', { bubbles: true }));

                    imageBoard.remove();
                    backDrop.remove();
                });

                imagesList.appendChild(imageCard);
            }
        }

        // get the recent image from the local storage
        chrome.storage.local.get(['recentImage'], (result) => {
            const imageCard = document.createElement('img');
            imageCard.src = result.recentImage;
            imageCard.style.width = '100px';
            imageCard.style.height = '100px';
            imageCard.style.objectFit = 'cover';

            imageCard.addEventListener('click', (event) => {
                const base64 = result.recentImage;
                const blob = base64ToBlob(base64);

                const type = base64.split(';')[0].split(':')[1];
                const fileType = type.split('/')[1];
                console.log(type, fileType);
                const file = new File([blob], `image_board_temp_${Date.now()}.${fileType}`, { type: type, lastModified: Date.now() });

                const data = new DataTransfer();
                data.items.add(file);

                inputImageEvent.target.files = data.files;
                inputImageEvent.target.dispatchEvent(new Event('change', { bubbles: true }));

                imageBoard.remove();
                backDrop.remove();
            });

            imagesList.appendChild(imageCard);
        });            
            

    } catch (error) {
        console.log(error);
    }

    const button = document.createElement('button');
    button.innerText = 'Show all files';
    button.addEventListener('click', (event) => {
        inputImageEvent.target.click();
    });

    imageBoard.appendChild(button);
    imageBoard.appendChild(imagesList);
}

function isImageBoardOpen() {
    return document.getElementById('imageBoard') !== null;
}

function base64ToBlob(base64) {
    const byteString = atob(base64.split(',')[1]);
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

backDrop.addEventListener('click', (event) => {
    imageBoard.remove();
    backDrop.remove();
});