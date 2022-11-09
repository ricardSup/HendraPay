// (function(){
  const regexQty = /[0-9]x/g;
  const regexAmt = /(Rp \d+|- Rp \d+)/g;
  const whiteList = "Selamat menikmati makanan Anda"
  const detailPesanan = [
      "Jenis Kendaraan", "Diterbitkan oleh Pengemudi", "Diterbitkan untuk", "Pesanan ID", "Pesanan Dari", "Lokasi Pengantaran", "Profil"
  ]
  let res;
  let resArray;
  let listArrObj;
  getData();
  setTimeout(() => {
      resArray = res.replace(/(\r\n|\n|\r)/gm, "").split('[image: E-receipt]');
      console.log(resArray);
      resArray = resArray.filter(function(x) {
          if (x.includes(whiteList)) {
              return x
          }
      })
      console.log(resArray);
  
      resArray.forEach((e, idx) => {
          let listKeyValPair = []
          let splitArr = e.split("Detail Tagihan");
          let arrDetailPesanan = splitArr[0];
          let arrDetailTagihan = splitArr[1];
          detailPesanan.forEach(item => {
              let idx = arrDetailPesanan.indexOf(item);
              if (idx >= 0) {
                  arrDetailPesanan = [arrDetailPesanan.slice(0, idx), " \\n ", arrDetailPesanan.slice(idx)].join('');
                  arrDetailPesanan = [arrDetailPesanan.slice(0, idx + item.length + " \\n ".length), " ; ", arrDetailPesanan.slice(idx + item.length + " \\n ".length)].join('');
              }
          });
  
          //qty
          // while (match = regexQty.exec(arrDetailTagihan)) {
          //   console.log(match.index + ' ' + regexQty.lastIndex);
          //   let idx = match.index
          // }
  
          // console.log(Array.from(arrDetailTagihan.matchAll(regexQty)).map(match => match.index))
          console.log(arrDetailTagihan);
          let arrReQty = []
          while ((match = regexQty.exec(arrDetailTagihan)) !== null) {
              console.log(`Found ${match[0]} start=${match.index} end=${regexQty.lastIndex}.`);
              let obj = {
                  "startIdx": match.index,
                  "endIdx": regexQty.lastIndex,
                  "value": match[0]
              }
              arrReQty.push(obj);
              // let idx = match.index
          }
  
          let appendDigit = 0;
          arrReQty.sort((a, b) => {
              a.startIdx - b.startIdx
          }).map((elem, ix) => {
              let idx = ix > 0 ? elem.startIdx + appendDigit : elem.startIdx
              let length = elem.value.length
              arrDetailTagihan = [arrDetailTagihan.slice(0, idx), " \\n ", arrDetailTagihan.slice(idx)].join('');
              arrDetailTagihan = [arrDetailTagihan.slice(0, idx + " \\n ".length + length), " ; ", arrDetailTagihan.slice(idx + " \\n ".length + length)].join('');
              
              console.log(arrDetailTagihan);
              appendDigit = appendDigit + " \\n ".length + " ; ".length;
          })
  
          //rp
          let arrReAmt = [];
          let idxST = arrDetailTagihan.indexOf("Subtotal");
          while ((match = regexAmt.exec(arrDetailTagihan)) !== null) {
              console.log(`Found ${match[0]} start=${match.index} end=${regexAmt.lastIndex}.`);
              let obj = {
                  "startIdx": match.index,
                  "endIdx": regexAmt.lastIndex,
                  "value": match[0]
              }
              arrReAmt.push(obj);
          }
  
          appendDigit = 0;
          arrReAmt.sort((a, b) => {
              a.startIdx - b.startIdx
          }).map((elem, ix) => {
              let idx = ix > 0 ? elem.startIdx + appendDigit : elem.startIdx
              let length = elem.value.length
              let lengthAppend = " ; ".length;
              arrDetailTagihan = [arrDetailTagihan.slice(0, idx), " ; ", arrDetailTagihan.slice(idx)].join('');
              if (idx > idxST) {
                  arrDetailTagihan = [arrDetailTagihan.slice(0, length + idx + " ; ".length), " ;\\n ", arrDetailTagihan.slice(length + idx + " ; ".length)].join('');
                  lengthAppend = lengthAppend + " ;\\n ".length;
              } else {
                  arrDetailTagihan = [arrDetailTagihan.slice(0, length + idx + " ; ".length), " ; ", arrDetailTagihan.slice(length + idx + " ; ".length)].join('');
                  lengthAppend = lengthAppend + " ; ".length;
              }
              appendDigit = appendDigit + lengthAppend;
              if (idx <= idxST) {
                  idxST = idxST + lengthAppend;
              }
          });
  
          arrDetailPesanan.split("\\n").map((e) => {
              let key, value;
              e.split(";").map((x, idx) => {
                  let val = x.trim();
                  if (idx == 0) key = val
                  if (idx == 1) {
                      if (val.charAt(0) == ":") val = val.slice(1);
                      value = val
                  }
              });
              let obj = {
                  "key": key,
                  "value": value
              }
              listKeyValPair.push(obj);
          });

          let posST = (arrDetailTagihan.split("\\n").findIndex(function(item){
            return item.indexOf("Subtotal")!==-1;
        }));

          arrDetailTagihan.split("\\n").map((e) => {
              let obj, key, value, qty, notes, isListItem = false;
              e.split(";").map((x, idx) => {
                if(idx <= posST){
                  isListItem = true;
                }
                let val = x.trim();
                if(!isListItem){
                  
                  if (idx == 0) key = val
                  if (idx == 1) {
                      if (val.charAt(0) == ":") val = val.slice(1);
                      value = val
                  }
                }else{
                  if (idx == 0) qty = val
                  if (idx == 1) key = val
                  if (idx == 2) value = val
                  if (idx == 3) notes = val
                }

              });
              if(!isListItem){
                obj = {
                    "key": key,
                    "value": value
                }
              }else{
                obj = {
                  "key": key,
                  "value": value,
                  "additional": [{
                    "key": "qty",
                    "value" : qty
                  },{
                    "key": "notes",
                    "value" : notes
                  }
                ]
              }
              }
              listKeyValPair.push(obj);
          });
          console.log(listKeyValPair);
          console.log(arrDetailTagihan);
      });
  }, 5000);
  // })();

  function getData() {
      return fetch('assets/receipt.eml')
          .then(response => {
              if (response.status >= 400) throw {
                  code: response.status
              }
              return response.text() // if you return a promise in a `then` block, the chained `then` block will get the resolved result
          })
          .then(text => {
              var temp = text
              res = temp
              return text
          })
          .catch(err => {
              // if at any stage of the promise chain, if a promise rejects, or throws, it will be caught by the `catch` block
              if (err.code) {
                  // handle status error
              } else {
                  // handle other errors
              }
          })
  }