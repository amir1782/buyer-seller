// ==UserScript==
// @name         Buyer/Seller Test
// @namespace    http://tampermonkey.net/
// @version      0.40
// @description  try to take over the world!
// @author       Amir K.
// @updateURL    https://raw.githubusercontent.com/amir1782/buyer-seller/master/buyer-seller.meta.js
// @downloadURL  https://raw.githubusercontent.com/amir1782/buyer-seller/master/buyer-seller.js
// @match        https://onlineplus.mofidonline.com
// @match        https://onlineplus.mofidonline.com/Home/Default/page-1
// @match        https://onlineplus.mofidonline.com/Home/Default
// @match        https://onlineplus.mofidonline.com/Home/Default2
// @match        https://silver.nashbro.com
// @match        https://silver.nashbro.com/Home/Default/page-1
// @match        https://silver.nashbro.com/Home/Default
// @match        https://silver.nashbro.com/Home/Default2
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    const scriptVersion = '0.40';



    // Initialize Global Variables

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

    let sendingMethod = GM_getValue('sendingMethod', 0);
    let is24hours = GM_getValue('hours24', false);
    let isManualCheck = GM_getValue('manualCheck', true);
    let isTolerance =GM_getValue('tolerance', 50);

    const PRESET1_INITIAL_TIME = GM_getValue('PR1_INIT', '8:29:55');
    const PRESET1_ORDER_NUMBER = GM_getValue('PR1_NUM', '15');
    const PRESET1_TIME_INTERVAL = GM_getValue('PR1_INT', '500');
    const PRESET1_TIME_TOLERANCE = GM_getValue('PR1_TOL', '10');

    const PRESET2_INITIAL_TIME = GM_getValue('PR2_INIT', '12:34:55');
    const PRESET2_ORDER_NUMBER = GM_getValue('PR2_NUM', '15');
    const PRESET2_TIME_INTERVAL = GM_getValue('PR2_INT', '500');
    const PRESET2_TIME_TOLERANCE = GM_getValue('PR2_TOL', '10');



    // Create Settings Modal Layout

    let modalContainer = document.createElement('div');
    modalContainer.classList.add('set-modal');
    document.body.appendChild(modalContainer);



    // Add Items to Settings Modal

    let modalContent = document.createElement('div');
    modalContent.classList.add('set-modal-content');
    modalContainer.appendChild(modalContent);


    // Modal Header
    let modalHeaderDiv = document.createElement('div');
    modalHeaderDiv.classList.add('set-modal-header');
    modalHeaderDiv.innerHTML += '<h4 class="set-modal-title">تنظیمات</h4>';
    modalContent.appendChild(modalHeaderDiv);

    let closeSettingsSpan = document.createElement('span');
    closeSettingsSpan.classList.add('set-modal-close');
    closeSettingsSpan.style.cursor = 'pointer';
    closeSettingsSpan.innerHTML = '&times;';
    closeSettingsSpan.onclick = closeSettingsPressed;
    modalHeaderDiv.appendChild(closeSettingsSpan);


    // Modal Body
    let modalBodyDiv = document.createElement('div');
    modalBodyDiv.classList.add('set-modal-body');
    modalContent.appendChild(modalBodyDiv);

    // Sending Method Setting
    modalBodyDiv.innerHTML += '' +
        '<label for="endMethodSel">روش ارسال</label>' +
        '<select id="end-method" name="endMethodSel">' +
        '  <option>زمان پایانی</option>' +
        '  <option>تعداد ارسال</option>' +
        '</select>';

    // (12/24) Hours Setting
    modalBodyDiv.innerHTML += '' +
        '<label class="set-toggle-control f-left">' +
        '  <input type="checkbox" id="24-hours">' +
        '  <span class="control"></span>' +
        '</label>' +
        '<p>ورود و نمایش زمان در حالت زمان 24 ساعته</p>';

    // Minimum Sending Interval Setting
    modalBodyDiv.innerHTML += '' +
        '<label class="set-toggle-control f-left">' +
        '  <input type="checkbox" id="minimum-check">' +
        '  <span class="control"></span>' +
        '</label>' +
        '<p>رعایت حداقل فاصله زمانی بین ارسال‌ها</p>';

    // Tolerance Interval Setting
    modalBodyDiv.innerHTML += '' +
        '<label class="set-toggle-control f-left">' +
        '  <input type="checkbox" id="interval-tolerance" checked="checked">' +
        '  <span class="control"></span>' +
        '</label>' +
        '<p>نوسان در فاصله‌های زمانی بین ارسال‌ها</p>';


    // Modal Footer
    let modalFooterDiv = document.createElement('div');
    modalFooterDiv.classList.add('set-modal-footer');
    modalContent.appendChild(modalFooterDiv);

    modalFooterDiv.innerHTML += '<p id="script-version" class="f-left">Ver. ' + scriptVersion + '</p>' ;

    let modalSaveBtn = document.createElement('button');
    modalSaveBtn.classList.add('save-button');
    modalSaveBtn.innerText = 'ذخیره';
    modalSaveBtn.style.cursor = 'pointer';
    modalSaveBtn.onclick = saveButtonPressed;
    modalFooterDiv.appendChild(modalSaveBtn);

    let modalResetBtn = document.createElement('button');
    modalResetBtn.classList.add('reset-button');
    modalResetBtn.innerText = 'تنظیمات اولیه';
    modalResetBtn.style.cursor = 'pointer';
    modalResetBtn.onclick = resetButtonPressed;
    modalFooterDiv.appendChild(modalResetBtn);



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


    // Settings Button
    let settingsBtn = document.createElement('button');
    settingsBtn.classList.add('gray');
    settingsBtn.innerText = 'تنظیمات...';
    settingsBtn.style.cursor = 'pointer';
    settingsBtn.onclick = settingsButtonPressed;
    divContainer.appendChild(settingsBtn);


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
        '.set-modal * {' +
        '    box-sizing: border-box;' +
        '    font-family: inherit;' +
        '    font-size: 11px;' +
        '    color: black;' +
        '}' +
        '' +
        '.set-modal {' +
        '    display: none;' +
        '    position: fixed;' +
        '    z-index: 10000;' +
        '    left: 0;' +
        '    top: 0;' +
        '    width: 100%;' +
        '    height: 100%;' +
        '    overflow: auto;' +
        '    background-color: rgba(33, 37, 41, 0.4);' +
        '}' +
        '' +
        '.set-modal-content {' +
        '    position: relative;' +
        '    box-sizing: border-box;' +
        '    background-color: white;' +
        '    margin: 10% auto;' +
        '    border: 1px solid rgba(0, 0, 0, 0.2);' +
        '    border-radius: 6px;' +
        '    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);' +
        '    width: 350px;' +
        '}' +
        '' +
        '.set-modal-header, .set-modal-body {' +
        '    padding: 15px;' +
        '    border-bottom: 1px solid #e5e5e5;' +
        '}' +
        '' +
        '.set-modal-footer {' +
        '    padding: 15px;' +
        '}' +
        '' +
        '.set-modal-title {' +
        '    margin: 0;' +
        '    font-size: 18px;' +
        '}' +
        '' +
        '.set-modal-close {' +
        '    color: #aaa;' +
        '    position: absolute;' +
        '    top: 0;' +
        '    left: 0;' +
        '    padding: 8px;' +
        '    font-size: 28px;' +
        '}' +
        '' +
        '.set-modal-content label {' +
        '    display: inline-block;' +
        '    margin-bottom: 8px;' +
        '}' +
        '' +
        '.set-modal-content select {' +
        '    display: block;' +
        '    width: 100%;' +
        '    height: 38px;' +
        '    margin-bottom: 15px;' +
        '    padding: 6px 12px;' +
        '    border-radius: 4px;' +
        '    border-color: #80bdff;' +
        '    outline: 0;' +
        '    box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);' +
        '    font-size: 14px;' +
        '}' +
        '' +
        '.set-modal-content p {' +
        '    margin: 0;' +
        '    padding: 15px 0;' +
        '}' +
        '' +
        '#script-version {' +
        '    font-style: italic;' +
        '    color: #dae0e5;' +
        '}' +
        '' +
        '.save-button {' +
        '    color: white;' +
        '    background-color: #007bff;' +
        '    display: inline-block;' +
        '    width: 100px;' +
        '    padding: 6px 12px;' +
        '    margin-left: 7.5px;' +
        '    border: 1px solid #007bff;' +
        '    border-radius: 4px;' +
        '    -webkit-transition: all 0.15s ease-in-out;' +
        '    -moz-transition: all 0.15s ease-in-out;' +
        '    -o-transition: all 0.15s ease-in-out;' +
        '    transition: all 0.15s ease-in-out;' +
        '}' +
        '' +
        '.save-button:hover {' +
        '    background-color: #0069d9;' +
        '    border-color: #0062cc;' +
        '}' +
        '' +
        '.reset-button {' +
        '    color: white;' +
        '    background-color: #6c757d;' +
        '    display: inline-block;' +
        '    width: 100px;' +
        '    padding: 6px 12px;' +
        '    border: 1px solid #6c757d;' +
        '    border-radius: 4px;' +
        '    -webkit-transition: all 0.15s ease-in-out;' +
        '    -moz-transition: all 0.15s ease-in-out;' +
        '    -o-transition: all 0.15s ease-in-out;' +
        '    transition: all 0.15s ease-in-out;' +
        '}' +
        '' +
        '.reset-button:hover {' +
        '    background-color: #5a6268;' +
        '    border-color: #545b62;' +
        '}' +
        '' +
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
        '.divContainer * {' +
        '    vertical-align: middle;' +
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
        '    color: white;' +
        '}' +
        '' +
        '.divContainer button.green {' +
        '    background-image: linear-gradient(var(--tp-3d-bu-gr));' +
        '    border: var(--tp-3d-bu-gr-bo);' +
        '}' +
        '' +
        '.divContainer button.green:hover {' +
        '    background-image: linear-gradient(var(--tp-3d-bu-gr-h));' +
        '}' +
        '' +
        '.divContainer button.red {' +
        '    background-image: linear-gradient(var(--tp-3d-bu-re));' +
        '    border: var(--tp-3d-bu-re-bo);' +
        '}' +
        '' +
        '.divContainer button.red:hover {' +
        '    background-image: linear-gradient(var(--tp-3d-bu-re-h));' +
        '}' +
        '' +
        '.divContainer button.gray {' +
        '    background-image: linear-gradient(var(--tp-3d-bu));' +
        '    border: var(--tp-3d-bu-bo);' +
        '    color: var(--tp-3d-bu-co);' +
        '}' +
        '' +
        '.divContainer button.gray:hover {' +
        '    background-image: linear-gradient(var(--tp-3d-bu-h));' +
        '}' +
        '' +
        '.divContainer fieldset {' +
        '    margin: 16px 0;' +
        '}' +
        '' +
        '.divContainer input[type=radio] {' +
        '    margin: 8px 4px;' +
        '}' +
        '.divContainer input[type=checkbox] {' +
        '    margin: 0 4px;' +
        '}' +
        '' +
        '.f-left {' +
        '    float: left;' +
        '}';

    // CSS for Toggle Switch
    // https://codepen.io/garetmckinley/pen/YmxYZr
    stylesText += '' +
        '.set-toggle-control {' +
        '    display: block;' +
        '    position: relative;' +
        '    margin-top: 9px;' +
        '    padding-left: 55px;' +
        '    margin-bottom: 12px;' +
        '    cursor: pointer;' +
        '    font-size: 22px;' +
        '    user-select: none;' +
        '}' +
        '.set-toggle-control input {' +
        '    position: absolute;' +
        '    opacity: 0;' +
        '    cursor: pointer;' +
        '    height: 0;' +
        '    width: 0;' +
        '}' +
        '.set-toggle-control input:checked ~ .control {' +
        '    background-color: #007bff;' +
        '}' +
        '.set-toggle-control input:checked ~ .control:after {' +
        '    left: 28px;' +
        '}' +
        '.set-toggle-control .control {' +
        '    position: absolute;' +
        '    top: 0;' +
        '    left: 0;' +
        '    height: 30px;' +
        '    width: 55px;' +
        '    border-radius: 15px;' +
        '    background-color: #dae0e5;' +
        '    transition: background-color 0.2s ease-in;' +
        '}' +
        '.set-toggle-control .control:after {' +
        '    content: "";' +
        '    position: absolute;' +
        '    left: 3px;' +
        '    top: 3px;' +
        '    width: 24px;' +
        '    height: 24px;' +
        '    border-radius: 15px;' +
        '    background: white;' +
        '    transition: left 0.2s ease-in;' +
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
        } else if (!manualCheckbox.checked && parseInt(difInput.value) < 300) {
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


    // Settings Button Pressed
    function settingsButtonPressed() {

        // Set the Values
        document.getElementById('end-method').selectedIndex = sendingMethod;
        document.getElementById('24-hours').checked = is24hours;
        document.getElementById('minimum-check').checked = isManualCheck;
        document.getElementById('interval-tolerance').checked = (isTolerance > 0) ? true : false;

        modalContainer.style.display = 'block';
    }


    // Close Button Pressed
    function closeSettingsPressed() {
        modalContainer.style.display = 'none';
    }


    // Modal Clicked
    window.onclick = function(event) {
        if (event.target == modalContainer) {
            modalContainer.style.display = 'none';
        }
    }


    // Modal Save Button Pressed
    function saveButtonPressed() {
        sendingMethod = document.getElementById('end-method').selectedIndex;
        GM_setValue('sendingMethod', sendingMethod);
        is24hours = document.getElementById('24-hours').checked;
        GM_setValue('hours24', is24hours);
        isManualCheck = document.getElementById('minimum-check').checked;
        GM_setValue('manualCheck', isManualCheck);
        // GM_setValue('tolerance', document.getElementById('24-hours').checked);
        // document.getElementById('interval-tolerance').checked = (isTolerance > 0) ? true : false;
        closeSettingsPressed();
    }


    // Modal Reset Button Pressed
    function resetButtonPressed() {
        document.getElementById('end-method').selectedIndex = 0;
        document.getElementById('24-hours').checked = false;
        document.getElementById('minimum-check').checked = true;
        // GM_setValue('tolerance', document.getElementById('24-hours').checked);
        // document.getElementById('interval-tolerance').checked = (isTolerance > 0) ? true : false;
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