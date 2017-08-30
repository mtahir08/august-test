$(document).ready(() => {
    let options = [], coupons = [];
    let db_ref = firebase.database().ref();
    saveItems = () => {
        let obj = {
            'name': getValue('item-name'),
            'price': getValue('item-price'),
            'description': getValue('item-description'),
            'options': options,
        }
        if (obj.name && obj.price && obj.description && obj.options.length > 0) {
            const file = document.getElementById("file").files[0];
            if (file) {
                const isValidFile = validateFile(file);
                // Check file type . Only png and jpg images are accepted for now
                (isValidFile) ? save(file).then(onseccess).catch(error) : alert("file not allowed..");
            } else alert("please select file.");

        } else alert("Please fill all fields.");

        function onseccess(url) {
            obj['url'] = url;
            obj['created_at'] = firebase.database.ServerValue.TIMESTAMP;
            addToDB(obj);
        };
        function error(err) { console.log(err) };
    }

    renderItems = (options) => {
        $('#option-items').html(
            options.map((option, index) => {
                console.log(option.tag)
                return `<div key=${index} class="badge" style="background: #ECEFF1;color: #848D8F;padding: 8px 12px;font-size: 16px;">${option.tag}  <i class="fa fa-times remove-item"  id=${index} onclick='removeItem(${index})'></i></div>`
            }));
    }

    $('#item-options').keypress((e) => {
        var key = e.which;
        if (key == 13)  // the enter key code
        {
            // const value = getValue('item-options')
            options.push({ tag: e.target.value });
            renderItems(options);
            return false;
        }
    });

    select = () => {
        $('input[name = image]').click();
    }
    getValue = (id) => {
        return document.getElementById(id).value;
    }
    emptyValue = (id) => {
         document.getElementById(id).value = "";
    }

    removeItem = (index) => {
        options.splice(index, 1);
        renderItems(options);
    };

    function validateFile(file) {
        let filename = file.name;
        let reg = /(\.png|\.jpg|\.jpeg)$/i;
        let extension = reg.exec(filename);
        if (!extension) return false;
        return true;
    }

    addToDB = (obj) => {
        // return new Promise((resolve, reject) => {
        db_ref.child('products').push(obj, callback);

        function callback(error) {
            if (error)
                console.log('Error has occured during saving process', error)
            else
                console.log("Data hss been saved succesfully")
            $('#add_item_modal').modal('hide');
        }
        // })
    }

    save = (file) => new Promise((resolve, reject) => {
        var storageRef = firebase.storage().ref();
        //dynamically set reference to the file name
        var thisRef = storageRef.child(file.name);

        //put request upload file to firebase storage
        thisRef.put(file).then((snapshot) => {
            console.log('Uploaded a blob or file!', snapshot);
            //get request to get URL for uploaded file
            thisRef.getDownloadURL().then((url) => {
                resolve(url)
            }).catch(onError);
        }).catch(onError);

        function onError(err) {
            reject(err)
        }
    })

    db_ref.child('products').on('value', (snapshot) => {
        let data = snapshot.val();
        data = Object.values(data);
        $('#products_body').html(
            data.map((val, key) => {
                return `<tr><td>${key}</td><td>${val['name']}</td><td>${val['price']}</td><td>${val['created_at']}</td></tr>`
                // return `<div key=${key} class="badge" style="background: #ECEFF1;color: #848D8F;padding: 8px 12px;font-size: 16px;">${val} </div>`
            }));
    })

    db_ref.child('tokens').on('value', (snapshot) => {
        let data = snapshot.val();
        coupons = Object.values(data);

        // $('#products_body').html(
        //     data.map((val, key) => {
        //         return `<tr><td>${key}</td><td>${val['name']}</td><td>${val['price']}</td><td>${val['created_at']}</td></tr>`
        //         // return `<div key=${key} class="badge" style="background: #ECEFF1;color: #848D8F;padding: 8px 12px;font-size: 16px;">${val} </div>`
        //     }));
    })

    addCoupon = () => {
        coupons.push({ token: getValue('coupon') });
        emptyValue('coupon');
        db_ref.child('tokens').set(coupons)
    }

});
