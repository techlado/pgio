// Add required packages
const express = require("express");
const app = express();
require('dotenv').config();
const multer = require("multer");
const upload = multer();

// Add database package and connection string (can remove ssl)
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 2
});

// Set up EJS
app.set("view engine", "ejs");

// Setup routes
app.get("/", (req, res) => {
  //res.send ("Hello world...");
  const sql = "SELECT * FROM PRODUCT ORDER BY PROD_ID";
  pool.query(sql, [], (err, result) => {
    let message = "";
    let model = {};
    if (err) {
      message = `Error - ${err.message}`;
    } else {
      message = "success";
      model = result.rows;
    };
    //Test - output to server console
    // console.log("Result is:", result);
    // console.log("==================================");
    // console.log("Error is:", err);
    // console.log("Message is:", message);
    // console.log("Model is:", model);

    // Send result to index view
    res.render("index", {
      message: message,
      model: model
    });
  });
});

app.get("/input", (req, res) => {
  res.render("input");
});
app.post("/input", upload.single('filename'), (req, res) => {
  if (!req.file || Object.keys(req.file).length === 0) {
    let message = "Error: Import file not uploaded";
    return res.send(message);
  };
  //Read file line by line, inserting records
  const buffer = req.file.buffer;
  const lines = buffer.toString().split(/\r?\n/);
  lines.forEach(line => {
    //console.log(line);
    let product = line.split(",");
    //console.log(product);
    const sql = "INSERT INTO PRODUCT(prod_id, prod_name, prod_desc, prod_price) VALUES($1, $2, $3, $4)";
    pool.query(sql, product, (err, result) => {
      if (err) {
        console.log(`Insert Error. Error message: ${err.message}`);
      } else {
        console.log(`Inserted successfully`);
      }
    });
  });
  let message = `Processing Complete - Processed ${lines.length} records`;
  res.send(message);
});

app.get("/output", (req, res) => {
  let message = "";
  res.render("output", { message: message });
});
app.post("/output", (req, res) => {
  const sql = "SELECT * FROM PRODUCT ORDER BY PROD_ID";
  pool.query(sql, [], (err, result) => {
    let message = "";
    if (err) {
      message = `Error - ${err.message}`;
      res.render("output", { message: message })
    } else {
      let output = "";
      result.rows.forEach(product => {
        output +=
          `${product.prod_id},${product.prod_name},${product.prod_desc},${product.prod_price}\r\n`;
      });
      res.header("Content-Type", "text/csv");
      res.attachment("export.csv");
      return res.send(output);
    };
  });
});

// Start listener
app.listen(process.env.PORT || 3000, () => {
  console.log("Server started (http://localhost:3000/) !");
});