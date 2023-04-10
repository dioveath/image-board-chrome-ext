console.log("content.js loaded");


const extPay = ExtPay('easy-image---clipboard-for-images');

const isProUser = async () => {
    const user = await extPay.getUser();
    return user.paid;
};

const IMAGE_CARD_WIDTH = 100;
const IMAGE_CARD_HEIGHT = 100;

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
        if (isImageBoardOpen()) {
            imageBoard.remove();
            backDrop.remove();
            return;
        }

        event.preventDefault();

        imageBoard.style.position = 'absolute';
        imageBoard.style.top = Math.max(0, Math.min(event.clientY, window.innerHeight - 200)) + 'px';
        imageBoard.style.left = Math.max(0, Math.min(event.clientX, window.innerWidth - 400)) + 'px';
        imageBoard.style.padding = '20px';
        imageBoard.style.borderRadius = '10px';
        imageBoard.style.boxShadow = '0 0 10px 0 rgba(0,0,0,0.5)';
        imageBoard.style.overflow = 'hidden';



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
        if (isImageBoardOpen()) {
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

            // get the list of recent images from the local storage
            chrome.storage.local.get(['recentImages'], (result) => {
                // convert the list of recent images to array
                let recentImages = result.recentImages ? result.recentImages.split('|') : [];
                recentImages = recentImages.filter(image => image !== base64);
                recentImages.push(base64);
                
                // remove the oldest image if the array is more than 5
                if (recentImages.length > 5) { recentImages.shift(); }

                recentImages = recentImages.join('|');
                chrome.storage.local.set({ recentImages: recentImages });
            });


        };

        reader.onerror = (error) => {
            console.log('Error: ', error);
        };

    });

});



async function initializeImageBoard(imageBoard, inputImageEvent) {
    imageBoard.innerHTML = '';

    const clipBoardDiv = document.createElement('div');
    clipBoardDiv.style.cssText = `width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.9); display: flex; flex-direction: row; overflow: auto;`;

    const recentImagesDiv = document.createElement('div');
    
    const imagesList = document.createElement('ul');
    imagesList.style.cssText = `width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.9); display: flex; flex-direction: row; overflow: auto; overflow-y: hidden; overflow-x: auto;`;

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
        chrome.storage.local.get(['recentImages'], async (result) => {
            // convert the list of recent images to array
            const recentImages = result.recentImages ? result.recentImages.split('|') : [];
            recentImages.reverse();

            const proUser = await isProUser();

            recentImages.forEach((recentImage, index) => {
                const imageCard = document.createElement('img');
                imageCard.src = recentImage;
                imageCard.style.width = '100px';
                imageCard.style.height = '100px';
                imageCard.style.objectFit = 'cover';


                imageCard.addEventListener('click', (event) => {
                    // if the user is not pro, then disable the last 4 recent images
                    if (!proUser && index > 0) {
                        return;
                    }
                    
                    const base64 = recentImage;
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

                // if the user is not pro, then disable the recent images
                if (!proUser && index > 0) {
                    imageCard.style.filter = 'grayscale(100%)';
                    imageCard.style.cursor = 'not-allowed';
                }

                imagesList.appendChild(imageCard);
            });

        });


    } catch (error) {
        console.log(error);
    }

    recentImagesDiv.appendChild(imagesList);
    imageBoard.appendChild(recentImagesDiv);

    const button = document.createElement('button');
    button.innerText = 'Show all files';
    button.addEventListener('click', (event) => {
        inputImageEvent.target.click();
    });

    const payNow = document.createElement('button');
    payNow.innerText = 'Become pro now';
    payNow.addEventListener('click', (event) => {
        extPay.openPaymentPage();
    }, true);

    const actionsDiv = document.createElement('div');
    actionsDiv.style.cssText = `width: 100%; background-color: rgba(0, 0, 0, 0.9); display: flex; flex-direction: row; overflow: auto; justify-content: space-between;`;

    actionsDiv.appendChild(button);    
    actionsDiv.appendChild(payNow);

    imageBoard.appendChild(actionsDiv);
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