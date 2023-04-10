console.log("content.js loaded");


const extPay = ExtPay('easy-image---clipboard-for-images');

const isProUser = async () => {
    const user = await extPay.getUser();
    return user.paid;
};

chrome.runtime.sendMessage({ message: 'insert-css' });

const IMAGE_CARD_WIDTH = 100;
const IMAGE_CARD_HEIGHT = 100;

const inputImages = document.querySelectorAll('input[type="file"][accept="image/*"]');

const backDrop = document.createElement('div');
backDrop.id = 'backDrop';

const imageBoard = document.createElement('div');
imageBoard.id = 'imageBoard';

imageBoard.classList.add('easy-container');
backDrop.classList.add('easy-backdrop');

const easyHeader = document.createElement('div');
easyHeader.classList.add('easy-header');
const easyBody = document.createElement('div');
easyBody.classList.add('easy-body');
const easyFooter = document.createElement('div');
easyFooter.classList.add('easy-footer');

const easyHeaderTitle = document.createElement('p');
easyHeaderTitle.classList.add('easy-title');
easyHeaderTitle.innerText = 'Easy Image Board - Clipboard for Images';

const closeImageBoardButton = document.createElement('button');
closeImageBoardButton.classList.add('easy-btn', 'easy-btn-primary');
closeImageBoardButton.innerText = 'X';

closeImageBoardButton.addEventListener('click', (event) => {
    event.preventDefault();
    closeImageBoard();
});

easyHeader.appendChild(easyHeaderTitle);
easyHeader.appendChild(closeImageBoardButton);


const clipBoardDiv = document.createElement('div');
clipBoardDiv.classList.add('easy-body-clipboard');
const recentImagesDiv = document.createElement('div');
recentImagesDiv.classList.add('easy-body-recent');

const imagesListTitle = document.createElement('p');
imagesListTitle.classList.add('easy-title-small');
imagesListTitle.innerText = 'Recent Images';

const imagesList = document.createElement('div');
imagesList.classList.add('easy-slider');

recentImagesDiv.appendChild(imagesListTitle);
recentImagesDiv.appendChild(imagesList);

easyBody.appendChild(clipBoardDiv);
easyBody.appendChild(recentImagesDiv);

imageBoard.appendChild(easyHeader);
imageBoard.appendChild(easyBody);
imageBoard.appendChild(easyFooter);

document.body.appendChild(backDrop);
document.body.appendChild(imageBoard);

closeImageBoard();

inputImages.forEach(inputImage => {
    inputImage.addEventListener('click', async (event) => {
        if (isImageBoardOpen()) {
            closeImageBoard();
            return;
        }

        event.preventDefault();
        backDrop.classList.remove('easy-close');
        imageBoard.classList.remove('easy-close');
        imageBoard.style.position = 'absolute';
        imageBoard.style.top = Math.max(0, Math.min(event.clientY, window.innerHeight - 200)) + 'px';
        imageBoard.style.left = Math.max(0, Math.min(event.clientX, window.innerWidth - 400)) + 'px';

        initializeImages(imagesList, clipBoardDiv, event);
        initializeFooter(easyFooter, event);
    });

    inputImage.addEventListener('change', (event) => {
        console.log('ImageBoard input change');
        if (isImageBoardOpen()) {
            closeImageBoard();
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


async function initializeImages(slider, clipBoardDiv, inputImageEvent) {
    slider.innerHTML = '';
    clipBoardDiv.innerHTML = '';

    const clipboardTitle = document.createElement('p');
    clipboardTitle.classList.add('easy-title-small');
    clipboardTitle.innerHTML = 'Clipboard Image';
    clipBoardDiv.appendChild(clipboardTitle);

    const prevSlideBtn = document.createElement('button');
    prevSlideBtn.classList.add('easy-btn-slider', 'easy-btn-prev');
    prevSlideBtn.innerHTML = '<';
    
    const nextSlideBtn = document.createElement('button');
    nextSlideBtn.classList.add('easy-btn-slider', 'easy-btn-next');
    nextSlideBtn.innerHTML = '>';
    
    await slider.appendChild(prevSlideBtn);
    await slider.appendChild(nextSlideBtn);    
    
    try {
        let foundInClipboard = false;
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
            for (const type of item.types) {
                if (type.startsWith('image/') === false) continue;
                const blob = await item.getType(type);
                const dataUrl = URL.createObjectURL(blob);

                const imageCard = document.createElement('img');
                imageCard.classList.add('easy-image-card');
                imageCard.src = dataUrl;

                imageCard.addEventListener('click', (event) => {
                    const fileType = type.split('/')[1];
                    const file = new File([blob], `image_board_temp_${Date.now()}.${fileType}`, { type: type, lastModified: Date.now() });

                    const data = new DataTransfer();
                    data.items.add(file);

                    inputImageEvent.target.files = data.files;
                    inputImageEvent.target.dispatchEvent(new Event('change', { bubbles: true }));

                    closeImageBoard();
                });

                foundInClipboard = true;
                // slideCard.appendChild(imageCard);
                clipBoardDiv.appendChild(imageCard);
            }
        }

        if (!foundInClipboard) { 
            // add a dummy image to the clipboard
            const imageCard = document.createElement('div');
            imageCard.classList.add('easy-image-card', 'easy-title-small');
            imageCard.innerHTML = 'No Image in Clipboard';
            clipBoardDiv.appendChild(imageCard);
        }

        // get the recent image from the local storage
        chrome.storage.local.get(['recentImages'], async (result) => {
            // convert the list of recent images to array
            const recentImages = result.recentImages ? result.recentImages.split('|') : [];
            recentImages.reverse();

            let proUser = false;
            try {
                proUser = await isProUser();
            } catch (error) {
                console.log(error);
            }
            
            recentImages.forEach(async (recentImage, index) => {
                const slideCard = document.createElement('div');
                slideCard.classList.add('easy-slide');

                const imageCard = document.createElement('img');
                imageCard.src = recentImage;
                imageCard.classList.add('easy-image-card');

                imageCard.addEventListener('click', (event) => {
                    // if the user is not pro, then disable the last 4 recent images
                    if (!proUser && index > 0) {
                        return;
                    }
                    
                    const base64 = recentImage;
                    const blob = base64ToBlob(base64);

                    const type = base64.split(';')[0].split(':')[1];
                    const fileType = type.split('/')[1];
                    const file = new File([blob], `image_board_temp_${Date.now()}.${fileType}`, { type: type, lastModified: Date.now() });

                    const data = new DataTransfer();
                    data.items.add(file);

                    inputImageEvent.target.files = data.files;
                    inputImageEvent.target.dispatchEvent(new Event('change', { bubbles: true }));

                    closeImageBoard();
                });

                // if the user is not pro, then disable the recent images
                if (!proUser && index > 0) {
                    imageCard.style.filter = 'grayscale(100%)';
                    imageCard.style.cursor = 'not-allowed';
                }

                await slideCard.appendChild(imageCard);
                await slider.appendChild(slideCard);
            });

        });

        
    } catch (error) {
        console.log(error);
    }


    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
        console.log(error);
    }
    
    chrome.runtime.sendMessage({ message: 'init-slider' });    
}

async function initializeFooter(footer, eventOnTarget){
    footer.innerHTML = '';
    const button = document.createElement('button');
    button.innerText = 'Show all files';
    button.classList.add('easy-btn', 'easy-btn-primary');

    button.addEventListener('click', (event) => {
        eventOnTarget.target.click();
    });

    footer.classList.add('easy-footer');    
    footer.appendChild(button);    

    // check if the user is pro
    try {
        const proUser = await isProUser();
        if (!proUser) {
            const payNow = document.createElement('button');
            payNow.innerText = 'Become pro now';
            payNow.classList.add('easy-btn', 'easy-btn-pro');
        
            payNow.addEventListener('click', (event) => {
                extPay.openPaymentPage();
            }, true);
            footer.appendChild(payNow);        
        }
    } catch (error) {
        console.log(error);
    }
    
    imageBoard.appendChild(footer);    
}

function isImageBoardOpen() {
    const imageBoard = document.getElementById('imageBoard');
    return imageBoard && !imageBoard.classList.contains('easy-close');
}

function closeImageBoard(){
    imageBoard.classList.add('easy-close');
    backDrop.classList.add('easy-close');
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
    closeImageBoard();
});

