$(document).ready(() => {
    let db_ref = firebase.database().ref();
    let data = [], item = {}, editing = false, user = '123';
    showProduct = (index) => {
        item = {};
        item = data[index];
        item['quantity'] = 1;
        listAllData();
    }

    listAllData = () => {
        $('#show_item_modal').modal('show');
        $('#item').html(`<div style="display:flex; justify-content:flex-start"><div><img style="width:150px;height:130px" src=${item['url']}/> </div><div style="margin-top:10px;margin-left:10px;"> ${item['name']}<br />${item['description']}<br /><br /> $ ${item['price']}</div></div>`)
        $('#options').html(`<ul><form id="op">${item['options'].map((opt, i) => `<li style="list-style:none"> <label><input type="radio" name="options" onchange="checkedItem(${i})" id=${i} value=${JSON.stringify(opt)}></label>${opt['tag']} $${opt['price']}</li>`)}</form></ul>`)
        showQuanitiy();
    }

    showQuanitiy = () => {
        `<button type="button" class="btn btn-outline-primary waves-effect">Primary</button>`
        $('#quantity').html(`<div style="display:flex;margin-top:10px;"><p style="margin: 0;padding-top: 3px;margin-right: 10px;font-weight:bold;">Menu Option</p><div style="width:125px;padding:0;display:flex;justify-content:space-between" ><button onclick="decrementItem()" class="btn btn-outline-primary waves-effect" style="margin:0;padding:0.5rem 0.40rem 0.2rem 0.4rem;"><i class="fa fa-minus"></i></button><div style="margin-top: 3px;font-size: 18px;font-weight: bold;">${item['quantity']}</div><button onclick="incrementItem()" style="margin:0;padding:0.5rem 0.40rem 0.2rem 0.4rem" class="btn btn-outline-primary waves-effect"><i class="fa fa-plus"></i></button> </div></div>`)

    }

    incrementItem = () => { item['quantity']++; showQuanitiy(); }
    decrementItem = () => { item['quantity']--; showQuanitiy(); }
    checkedItem = (i) => {
        let selected_option = $('input[name=options]:checked', '#op').val();
        item.options[i]['checked'] = true;
        item['selected_option'] = JSON.parse(selected_option);
    }

    sendToCheckout = () => {
        item['total'] = (item['selected_option'].price * item['price']).toFixed(2);

        let obj_to_send = {
            'order_at': firebase.database.ServerValue.TIMESTAMP,
            'key': item['key'],
            'coupon': item['coupon'] || "",
            'total': item['total'] || "",
            'quantity': item['quantity'],
            'selected_option': item['selected_option'],
        }
        db_ref.child('pendingorders').child(user).set(obj_to_send, callback);
        function callback(error) {
            if (error)
                console.log('Error has occured during saving process', error)
            else {
                console.log("Data hss been saved succesfully")

            }
        }
    }

    editItem = () => {
        editing = true;
        $('#show_item_modal').modal('show');
        let item_index = item['options'].map(function searchItem(a) { return a['tag'] }).indexOf(item['selected_option'].tag)
        listAllData();
        $(`#${item_index}`).prop('checked', true);
    }

    removeAll = () => {
        console.log(db_ref.child('pendingorders').child(user))
        db_ref.child('pendingorders').child(user).remove();
    }

    checkToken = () => {
        let coupon_found = false;
        const entered_token = getValue('coupon');
        db_ref.child('tokens').once('value', (snapshot) => {
            let tokens = Object.values(snapshot.val());
            tokens.map((token) => {
                if (entered_token == token.token) {
                    coupon_found = true;
                    item['sub_total'] = (item['sub_total'] - (item['sub_total'] *= 0.05)).toFixed(2);

                    console.log(item['sub_total'])
                    $('#order-total').html(`<div style="display:flex; justify-content:space-between"><div>Sub Total:</div><div>${item['sub_total'] || item['total']}</div></div>
                    <div style="display:flex; justify-content:space-between"><div style="font-weight:bold">Order Total:</div><div>${item['total']}</div></div>`)
                    $("div.alert-success").removeClass("hide").addClass("show");
                    $('div.alert-success').text(`Token Accepted!!`);
                    setTimeout(() => {
                        $("div.alert-success").removeClass("show").addClass("hide");
                    }, 3000)
                    return false;
                }
            });
            if (!coupon_found) {
                $("div.alert-danger").removeClass("hide").addClass("show");
                $('div.alert-danger').text(`your token not valid`);
                setTimeout(() => {
                    $("div.alert-danger").removeClass("show").addClass("hide");
                }, 3000);
                return false;

            }


        })
    }
    getValue = (id) => {
        return document.getElementById(id).value;
    }
    db_ref.child('products').on('value', (snapshot) => {
        let obj_data = snapshot.val();
        // data = Object.values(obj_data);
        $('#products_body').html(
            Object.keys(obj_data).map((key, index) => {
                let val = obj_data[key];
                val['key'] = key;
                data.push(val);
                return `<tr><td style="width:151px"><img style="width:150px;height:130px" src=${val['url']}/> </td><td>${val['name']}<br />${val['description']}</td><td style="width:100px;text-align:right">${val['price']} <button type="button" class="btn btn-primary" style="padding:0.50rem" onclick="showProduct(${index})"><i class="fa fa-plus"></i></button></td></tr>`
                // return `<div key=${key} class="badge" style="background: #ECEFF1;color: #848D8F;padding: 8px 12px;font-size: 16px;">${val} </div>`
            }));
    })

    db_ref.child('pendingorders').child(user).on('value', (snapshot) => {
        const check_out_item = snapshot.val();
        (check_out_item)?GetValueFromProductsArray(check_out_item):"";

    })
    GetValueFromProductsArray = (check_out_item) => {
        if (data.length > 0) {
            console.log(check_out_item);
            item = data.find(function (d) { return d['key'] == check_out_item['key'] })
            console.log(check_out_item['selected_option']);
            item['selected_option'] = {};
            item['selected_option'] = check_out_item['selected_option'];
            item['quantity'] = check_out_item['quantity'];
            (item['coupon']) ? item['sub_total'] = item['total'] = (item['total'] - item['total'] * 0.05).toFixed() : "";
            renderCheckOutData(item);
        }
        else {
            setTimeout(() => GetValueFromProductsArray(check_out_item), 100)
        }
    }


    renderCheckOutData = (item) => {
        item['total'] = (item['selected_option'].price * item['price']).toFixed(2);
        item['sub_total'] = item['total'];
        $('#checkout_items').html(`<div>
            <table style="width:100%">
                <tr><td><i class="fa fa-minus-circle" style="color:gray;" onclick="removeAll()"></i></td><td onclick="editItem()">${item['quantity']} x ${item['name']}</td><td></td></tr>
                <tr><td></td><td>+ ${item['selected_option'].tag}</td><td class="item_align"> $${item['selected_option'].price}</td></tr>
                <tr><td></td><td></td><td class="item_align"> $${item['total']}</td></tr>
            </table></div>`);
        $('#order-total').html(`<div style="display:flex; justify-content:space-between"><div>Sub Total:</div><div>${item['sub_total']}</div></div>
            <div style="display:flex; justify-content:space-between"><div style="font-weight:bold">Order Total:</div><div>${item['total']}</div></div>`)
        $("div.alert-success").removeClass("hide").addClass("show");
        $("#coupon_div").removeClass("hide").addClass("show");
        (editing) ? $('div.alert-success').text(`order has been updated`) : $('div.alert-success').text(`Menu has been added to your order`);
        setTimeout(() => {
            $("div.alert-success").removeClass("show").addClass("hide");
        }, 3000)
        $('#show_item_modal').modal('hide');
    }

    // User name functions
    $('#user_name').keypress((e) => {
        var key = e.which;
        if (key == 13)  // the enter key code
        {
            user = e.target.value
            return false;
        }
    });
});
