/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
let os = require('os');
let yahooFinance = require('yahoo-finance');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
      let ip = os.networkInterfaces().eth0[0].address;
      let stock = req.query.stock;
      let quote;
      
      MongoClient.connect(CONNECTION_STRING, function(err, database) {
        let db = database.db('fccdatabase').collection('stock-market');
        if (err) console.log(err)
        
        
        if(Array.isArray(stock)) {
          var prices = [];
          
          yahooFinance.quote({
            symbol: stock[0].toUpperCase(),
            modules: ['price']
          }, (err, qte1) => {
            yahooFinance.quote({
              symbol: stock[1].toUpperCase(),
              modules: ['price']
            }, (err, qte2) => {
              let quote1 = qte1.price.regularMarketPrice;
              let quote2 = qte2.price.regularMarketPrice;
              let likes1;
              let likes2;
              
              if(req.query.like == "true") {
                db.count({stock: stock[0].toUpperCase()}, (err, data1) => {
                  likes1 = data1;
                  db.count({stock: stock[1].toUpperCase()}, (err, data2) => {
                    likes2 = data2;
                    return res.json({stockData:[{"stock":stock[0].toUpperCase(),"price":quote1,"rel_likes":likes1-likes2},
                                     {"stock":stock[1].toUpperCase(),"price":quote2,"rel_likes":likes2-likes1}]});
                  });
                });
              } else {
                return res.json({stockData:[{"stock":stock[0].toUpperCase(),"price":quote1},
                                     {"stock":stock[1].toUpperCase(),"price":quote2}]});
              }
              
            });
          });
        } else {
        
          stock = stock.toUpperCase();
          yahooFinance.quote({
            symbol: stock,
            modules: ['price']
          }, (err, qte) => {
            quote = qte.price.regularMarketPrice;

            if(req.query.like == "true") {      
              db.findOneAndUpdate({stock: stock}, {$push: {ips: ip}}, {upsert: true}, (err, data) => {
                data.value.ips = [...new Set(data.value.ips)];
                res.json({StockData: {stock: stock, price: quote, likes: data.value.ips.length }})
              });
            } else {
              db.count({stock: stock}, (err, data) => {
                res.json({StockData: {stock: stock, price: quote, likes: data }})
              })
            }

          });
        }
      });
      
    
    });
   
};

/*db.find({stock: stock, ip: ip}, (err, data) => {
              if(data) {
                db.count({stock: stock}, (err, data) => {
                  res.json({StockData: {stock: stock, price: quote, likes: data }})
                })
              } else {
                db.insertOne({stock: stock, ip: ip}, (err, res) => {
                  db.count({stock: stock}, (err, data) => {
                    res.json({StockData: {stock: stock, price: quote, likes: data }})
                  })
                });
              }   
            });*/