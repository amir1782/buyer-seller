// ==UserScript==
// @name         Buyer/Seller
// @namespace    http://tampermonkey.net/
// @version      0.37
// @description  try to take over the world!
// @author       Amir K.
// @updateURL    https://raw.githubusercontent.com/amir1782/buyer-seller/master/buyer-seller.js
// @downloadRUL  https://raw.githubusercontent.com/amir1782/buyer-seller/master/buyer-seller.js
// @match        https://onlineplus.mofidonline.com
// @match        https://onlineplus.mofidonline.com/Home/Default/page-1
// @match        https://onlineplus.mofidonline.com/Home/Default
// @match        https://onlineplus.mofidonline.com/Home/Default2
// @match        https://silver.nashbro.com
// @match        https://silver.nashbro.com/Home/Default/page-1
// @match        https://silver.nashbro.com/Home/Default
// @match        https://silver.nashbro.com/Home/Default2
// @grant        none
// ==/UserScript==

(function() {
    'use strict';



    // Define Global Variables

    let buyTabActivated = true;
    let sendingTimer;
    let checkingTimer;
    let sendButton;
    let diff = 0;
    let iter = 0;
    let totalIter = 0;
    let timeStr1 = '';
    let timeStr2 = '';
    let maxRandomSeconds = 0;

    const PRESET1_INITIAL_TIME = '8:29:55';
    const PRESET1_ORDER_NUMBER = '15';
    const PRESET1_TIME_INTERVAL = '500';
    const PRESET1_TIME_TOLERANCE = '10';

    const PRESET2_INITIAL_TIME = '12:34:55';
    const PRESET2_ORDER_NUMBER = '18';
    const PRESET2_TIME_INTERVAL = '500';
    const PRESET2_TIME_TOLERANCE = '10';



    // Prepare Layout to Add Sidebar

    let aContainer = document.getElementsByTagName('app-container')[0];
    aContainer.style.gridTemplateColumns = '40px auto 180px';
    let aHeader = document.getElementsByTagName('app-header')[0];
    aHeader.style.gridColumnEnd = '4';



    // Create and Add mySidebar

    let mySidebar = document.createElement('div');
    mySidebar.classList.add('mySidebar', 'buy');
    //mySidebar.style.borderWidth = '1px';

    let aContent = document.getElementsByTagName('app-content')[0];
    aContainer.insertBefore(mySidebar, aContent.nextSibling);



    // Add Items to mySidebar

    // Buy & Sell Navigation Bar
    let buyNavbar = document.createElement('button');
    buyNavbar.style.backgroundColor = '#d4edda';
    buyNavbar.style.color = '#155724';
    buyNavbar.innerText = 'خرید';
    buyNavbar.onclick = buyNavPressed;
    buyNavbar.disabled = false;
    mySidebar.appendChild(buyNavbar);

    let sellNavbar = document.createElement('button');
    sellNavbar.style.backgroundColor = '#f8d7da';
    sellNavbar.style.color = '#721c24';
    sellNavbar.innerText = 'فروش';
    sellNavbar.style.cursor = 'pointer';
    sellNavbar.onclick = sellNavPressed;
    mySidebar.appendChild(sellNavbar);


    // Main Div
    let divContainer = document.createElement('div');
    divContainer.classList.add('divContainer');
    mySidebar.appendChild(divContainer);


    // Form Div
    let formContainer = document.createElement('form');
    divContainer.appendChild(formContainer);


    // Symbol Label & Input
    let symLabel = document.createElement('label');
    symLabel.innerText = 'نماد:';
    formContainer.appendChild(symLabel);

    let symInput = document.createElement('input');
    symInput.type = 'text';
    symInput.name = 'symName';
    symInput.disabled = true;
    let observableDiv = document.querySelector('#fulltextContainer');
    if (observableDiv != null) {
        let observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                let symSpan = document.querySelector('#fulltextContainer .symbolText');
                if (symSpan != null && symSpan != '') {
                    symInput.value = symSpan.innerText;
                }
            });
        });
        let config = { attributes: true, childList: true, characterData: true };
        observer.observe(observableDiv, config);
    }
    formContainer.appendChild(symInput);


    // Share Number Label & Input
    let shareNumLabel = document.createElement('label');
    shareNumLabel.innerText = 'تعداد سهم:';
    formContainer.appendChild(shareNumLabel);

    let shareNumInput = document.createElement('input');
    shareNumInput.classList.add('numberField');
    shareNumInput.type = 'text';
    shareNumInput.name = 'numShareText';
    shareNumInput.disabled = true;
    shareNumInput.min = '1';
    let observableNum = document.querySelector('#send_order_txtCount');
    if (observableNum != null) {
        observableNum.addEventListener('keyup', function() { shareNumInput.value = observableNum.value; });
        observableNum.addEventListener('change', function() { shareNumInput.value = observableNum.value; });
    }
    formContainer.appendChild(shareNumInput);


    // Price Label & Input
    let sharePriceLabel = document.createElement('label');
    sharePriceLabel.innerText = 'قیمت سهم:';
    formContainer.appendChild(sharePriceLabel);

    let sharePriceInput = document.createElement('input');
    sharePriceInput.classList.add('numberField');
    sharePriceInput.type = 'text';
    sharePriceInput.name = 'priceShareText';
    sharePriceInput.disabled = true;
    sharePriceInput.min = '1';
    let observablePrice = document.querySelector('#send_order_txtPrice');
    if (observablePrice != null) {
        observablePrice.addEventListener('keyup', function() {sharePriceInput.value = observablePrice.value;});
        observablePrice.addEventListener('change', function() {sharePriceInput.value = observablePrice.value;});
    }
    formContainer.appendChild(sharePriceInput);


    // Time Label & Input
    let timeLabel = document.createElement('label');
    timeLabel.innerText = 'زمان ارسال سفارش:';
    formContainer.appendChild(timeLabel);

    let timeInput = document.createElement('input');
    timeInput.type = 'text';
    timeInput.name = 'timeText';
    timeInput.value = PRESET1_INITIAL_TIME;
    formContainer.appendChild(timeInput);


    // Number Label & Input
    let numLabel = document.createElement('label');
    numLabel.innerText = 'تعداد ارسال سفارش:';
    formContainer.appendChild(numLabel);

    let numInput = document.createElement('input');
    numInput.type = 'number';
    numInput.name = 'numText';
    numInput.value = PRESET1_ORDER_NUMBER;
    formContainer.appendChild(numInput);


    // Interval Label & Input
    let difLabel = document.createElement('label');
    difLabel.innerText = 'فاصله زمانی: (میلی ثانیه)';
    formContainer.appendChild(difLabel);

    let difInput = document.createElement('input');
    difInput.type = 'number';
    difInput.name = 'difText';
    difInput.value = PRESET1_TIME_INTERVAL;
    formContainer.appendChild(difInput);


    // Tolerance Label & Input
    let tolLabel = document.createElement('label');
    tolLabel.innerText = 'نوسان زمانی: (میلی ثانیه)';
    formContainer.appendChild(tolLabel);

    let tolInput = document.createElement('input');
    tolInput.type = 'number';
    tolInput.name = 'difText';
    tolInput.value = PRESET1_TIME_TOLERANCE;
    formContainer.appendChild(tolInput);


    // Submit Button
    let submitBtn = document.createElement('button');
    submitBtn.classList.add('green');
    submitBtn.innerText = 'ثبت سفارش';
    submitBtn.style.cursor = 'pointer';
    submitBtn.onclick = submitButtonPressed;
    divContainer.appendChild(submitBtn);


    // Presets Radio Buttons
    let presetsFieldset = document.createElement('fieldset');

    let presetsFieldsetLegend = document.createElement('legend');
    presetsFieldsetLegend.innerText = 'پیش فرض';
    presetsFieldset.appendChild(presetsFieldsetLegend);

    let preset1 = document.createElement('input');
    preset1.type = 'radio';
    preset1.id = 'preset1';
    preset1.name = 'presets';
    preset1.value = '1';
    preset1.onclick = presetSelected;
    presetsFieldset.appendChild(preset1);

    let presetLabel1 = document.createElement('label');
    presetLabel1.setAttribute('for', 'preset1');
    presetLabel1.innerText = 'پیش فرض 8:30';
    presetsFieldset.appendChild(presetLabel1);

    let lineBreak = document.createElement('br');
    presetsFieldset.appendChild(lineBreak);

    let preset2 = document.createElement('input');
    preset2.type = 'radio';
    preset2.id = 'preset2';
    preset2.name = 'presets';
    preset2.value = '2';
    preset2.onclick = presetSelected;
    presetsFieldset.appendChild(preset2);

    let presetLabel2 = document.createElement('label');
    presetLabel2.setAttribute('for', 'preset2');
    presetLabel2.innerText = 'پیش فرض 12:30';
    presetsFieldset.appendChild(presetLabel2);

    divContainer.appendChild(presetsFieldset);

    // Add Styles

    let newStyles = document.createElement('style');
    newStyles.type = 'text/css';
    let stylesText =
        '.mySidebar * {' +
        '    box-sizing: border-box;' +
        '    font-family: inherit;' +
        '    font-size: 11px;' +
        '    color: black;' +
        '}' +
        '' +
        '.mySidebar.buy {' +
        '    background-color: #d4edda;' +
        '    border-right: 1px solid #c3e6cb;' +
        '}' +
        '' +
        '.mySidebar.sell {' +
        '    background-color: #f8d7da;' +
        '    border-right: 1px solid #f5c6cb;' +
        '}' +
        '' +
        '.mySidebar button {' +
        '    width: 50%;' +
        '    height: 30px;' +
        '    border: none;' +
        '}' +
        '' +
        '.divContainer {' +
        '    margin: 16px;' +
        '}' +
        '' +
        '.divContainer form label {' +
        '    width: 100%;' +
        '    font-size: 9px;' +
        '}' +
        '' +
        '.divContainer form input[type=text], .divContainer form input[type=number] {' +
        '    width: 100%;' +
        '    margin: 8px 0 16px;' +
        '}' +
        '' +
        '.divContainer button {' +
        '    width: 100%;' +
        '    padding: 0;' +
        '    border-radius: 4px;' +
        '    border: var(--tp-3d-bu-gr-bo);' +
        '    color: white;' +
        '}' +
        '' +
        '.divContainer button.green {' +
        '    background-image: linear-gradient(var(--tp-3d-bu-gr));' +
        '}' +
        '' +
        '.divContainer button.green:hover {' +
        '    background-image: linear-gradient(var(--tp-3d-bu-gr-h));' +
        '}' +
        '' +
        '.divContainer button.red {' +
        '    background-image: linear-gradient(var(--tp-3d-bu-re));' +
        '}' +
        '' +
        '.divContainer button.red:hover {' +
        '    background-image: linear-gradient(var(--tp-3d-bu-re-h));' +
        '}' +
        '' +
        '.divContainer fieldset {' +
        '    margin: 16px 0;' +
        '}' +
        '' +
        '.divContainer fieldset * {' +
        '    vertical-align: middle;' +
        '}' +
        '' +
        '.divContainer input[type=radio] {' +
        '    margin: 8px 4px;' +
        '}';
    newStyles.innerText = stylesText;
    document.head.appendChild(newStyles);



    // Other Functions


    // Time Interval for Looking Input Changes
    let i = setInterval(checkInputs, 1000);
    function checkInputs() {
        if (observableNum != null) { shareNumInput.value = observableNum.value; }
        if (observablePrice != null) { sharePriceInput.value = observablePrice.value; }
    }


    // Disable Input Items
    function disableItems() {
        timeInput.disabled = true;
        numInput.disabled = true;
        difInput.disabled = true;
        tolInput.disabled = true;
    }


    // Enable Input Items
    function enableItems() {
        timeInput.disabled = false;
        numInput.disabled = false;
        difInput.disabled = false;
        tolInput.disabled = false;
    }


    // Activate Buy Nav
    function activateBuyNav() {
        mySidebar.classList.replace('sell', 'buy');
        buyNavbar.disabled = true;
        buyNavbar.style.cursor = 'auto';
        sellNavbar.disabled = false;
        sellNavbar.style.cursor = 'pointer';
        submitBtn.classList.replace('red', 'green');
        buyTabActivated = true;
    }


    // Activate Sell Nav
    function activateSellNav() {
        mySidebar.classList.replace('buy', 'sell');
        buyNavbar.disabled = false;
        buyNavbar.style.cursor = 'pointer';
        sellNavbar.disabled = true;
        sellNavbar.style.cursor = 'auto';
        submitBtn.classList.replace('green', 'red');
        buyTabActivated = false;
    }


    // Buy Nav Button Pressed
    function buyNavPressed() {
        let mainBuyDiv = document.getElementsByClassName('orderside65')[0];
        mainBuyDiv.click();
    }


    // Sell Nav Button Pressed
    function sellNavPressed() {
        let mainBuyDiv = document.getElementsByClassName('orderside86')[0];
        mainBuyDiv.click();
    }


    // Preset Selected
    function presetSelected() {
        if (preset1.checked) {
            timeInput.value = PRESET1_INITIAL_TIME;
            numInput.value = PRESET1_ORDER_NUMBER;
            difInput.value = PRESET1_TIME_INTERVAL;
            tolInput.value = PRESET1_TIME_TOLERANCE;
        } else if (preset2.checked) {
            timeInput.value = PRESET2_INITIAL_TIME;
            numInput.value = PRESET2_ORDER_NUMBER;
            difInput.value = PRESET2_TIME_INTERVAL;
            tolInput.value = PRESET2_TIME_TOLERANCE;
        }
    }


    // Clear All Time Intervals
    function stopSendingOrders() {
        if (checkingTimer != null) {
            clearInterval(checkingTimer);
        }
        if (sendingTimer != null) {
            clearInterval(sendingTimer);
        }
        enableItems();
        submitBtn.classList.replace('red', 'green');
        submitBtn.innerText = 'ثبت سفارش';
        submitBtn.onclick = submitButtonPressed;
    }


    // Set Time Interval for Sending Orders
    function startSendingOrders() {
        if (iter <= totalIter) {
            sendButton.click();
            let randomSeconds = Math.floor(Math.random() * maxRandomSeconds);
            console.log(iter, Date.now(), diff + randomSeconds);

            clearInterval(sendingTimer);
            sendingTimer = setInterval(startSendingOrders, diff + randomSeconds);
        } else {
            stopSendingOrders();
        }
        iter++;
    }


    // Set Time Interval for Checking Time
    function startCheckingTimes() {
        let timeNow = document.querySelector('clock.clock').innerText;
        if (timeNow != null) {
            if (timeNow == timeStr1 || timeNow == timeStr2) {

                // Set Time Interval for Checking Time
                sendButton = document.getElementById('send_order_btnSendOrder');
                if (sendButton != null) {
                    iter = 1;
                    totalIter = parseInt(numInput.value);
                    maxRandomSeconds = parseInt(tolInput.value);
                    clearInterval(checkingTimer);
                    sendingTimer = setInterval(startSendingOrders, diff);
                }
            }
        }
    }


    // Validate Input Items
    function validateInputItems() {
        if (symInput.value == null || symInput.value == '') {
            Notify({
                text: 'لطفاً نماد را مشخص کنید',
                type: 'error'
            });
            return false;
        } else if (shareNumInput.value == null || shareNumInput.value == '') {
            Notify({
                text: 'لطفاً تعداد سهم را مشخص کنید',
                type: 'error'
            });
            return false;
        } else if (sharePriceInput.value == null || sharePriceInput.value == '') {
            Notify({
                text: 'لطفاً قیمت سهم را مشخص کنید',
                type: 'error'
            });
            return false;
        } else if (isNaN(parseInt(numInput.value))) {
            Notify({
                text: 'لطفاً تعداد ارسال سفارش را مشخص کنید',
                type: 'error'
            });
            return false;
        } else if (parseInt(numInput.value) < 1) {
            Notify({
                text: 'حداقل تعداد سفارش می‌بایست 1 باشد',
                type: 'error'
            });
            return false;
        } else if (isNaN(parseInt(difInput.value))) {
            Notify({
                text: 'لطفاً فاصله زمانی را مشخص کنید',
                type: 'error'
            });
            return false;
        } else if (parseInt(difInput.value) < 300) {
            Notify({
                text: 'حداقل فاصله زمانی می‌بایست 300ms باشد',
                type: 'error'
            });
            return false;
        } else if (isNaN(parseInt(tolInput.value))) {
            Notify({
                text: 'لطفاً نوسان زمانی را مشخص کنید',
                type: 'error'
            });
            return false;
        } else if (parseInt(difInput.value) < 0) {
            Notify({
                text: 'حداقل نوسان زمانی می‌بایست 0 باشد',
                type: 'error'
            });
            return false;
        }
        return true;
    }


    // Submit Button Pressed
    function submitButtonPressed() {

        if (validateInputItems()) {
            let timeArr = timeInput.value.split(':');
            let hours = timeArr[0].padStart(2, '0');
            let minutes = timeArr[1] ? timeArr[1].padStart(2, '0') : '00';
            let seconds = timeArr[2] ? timeArr[2].padStart(2, '0') : '00';

            timeStr1 = hours + ':' + minutes + ':' + seconds;
            let hoursNum = parseInt(hours);
            if (parseInt(timeArr[0]) < 12) {
                let hoursNum = parseInt(timeArr[0]) + 12;
                hours = hoursNum.toString();
            } else {
                let hoursNum = parseInt(timeArr[0]) - 12;
                hours = hoursNum.toString().padStart(2, '0');
            }
            timeStr2 = hours + ':' + minutes + ':' + seconds;

            // Set Time Interval for Checking Time
            diff = parseInt(difInput.value);
            sendButton = document.getElementById('send_order_btnSendOrder');
            if (!isNaN(diff) && sendButton != null) {
                disableItems();
                checkingTimer = setInterval(startCheckingTimes, diff);
                submitBtn.classList.replace('green', 'red');
                submitBtn.innerText = 'توقف سفارش';
                submitBtn.onclick = stopSendingOrders;
            }
        }
    }


    // Onload Function Goes Here

    const observerConfig = { attributes: true };

    // Add Observer for Activation of Buy Div
    let buyDiv = document.getElementsByClassName('orderside65')[0];
    const buyDivObserver = new MutationObserver(function(mutationsList, observer) {
        for (let mutation of mutationsList) {
            if (mutation.type === 'attributes') {
                if (buyDiv.classList.contains('active')) {
                    console.log('Buy div is activated');
                    if (!buyTabActivated) {
                        activateBuyNav();
                    }
                }
            }
        }
    });
    buyDivObserver.observe(buyDiv, observerConfig);

    // Add Observer for Activation of Sell Div
    let sellDiv = document.getElementsByClassName('orderside86')[0];
    const sellDivObserver = new MutationObserver(function(mutationsList, observer) {
        for (let mutation of mutationsList) {
            if (mutation.type === 'attributes') {
                if (sellDiv.classList.contains('active')) {
                    console.log('Sell div is activated');
                    if (buyTabActivated) {
                        activateSellNav();
                    }
                }
            }
        }
    });
    sellDivObserver.observe(sellDiv, observerConfig);



})();