const express = require("express");
require("dotenv").config();
const app = express();
const mustacheExpress = require("mustache-express");
const bodyParser = require("body-parser");
const { Client } = require("pg");

const mustache = mustacheExpress();
mustache.cache = null;
app.engine("mustache", mustache);
app.set("view engine", "mustache");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/book-form", (req, res) => {
  res.render("book-form");
});

app.get("/books", async (req, res) => {
  const client = new Client();
  try {
    await client.connect();
    console.log("Conneted successfully");
    const result = await client.query("SELECT * FROM books");
    res.render("book-list", { books: result.rows });
  } catch (err) {
    console.log(err);
  } finally {
    await client.end();
    console.log("client disconnected");
  }
});

app.post("/books/delete/:id", async (req, res) => {
  const client = new Client();
  const id = req.params.id;
  try {
    await client.connect();
    const sql = "DELETE FROM books WHERE book_id = ($1)";
    const params = [id];
    await client.query(sql, params);
    res.redirect("/books");
  } catch (err) {
    console.log(err);
  } finally {
    await client.end();
    console.log("client disconnected");
  }
});

app.get("/book/edit/:id", async (req, res) => {
  const client = new Client();
  const id = req.params.id;
  try {
    await client.connect();
    const sql = "SELECT * FROM books WHERE book_id = ($1)";
    const params = [id];
    const result = await client.query(sql, params);
    console.log(result);
    // No book with that book_id
    if (result.rowCount === 0) {
      res.redirect("/books");
      return;
    }
    res.render("book-edit", {
      book: result.rows[0]
    });
  } catch (err) {
    console.log(err);
  } finally {
    await client.end();
    console.log("client disconnect");
  }
});

app.post("/book/add", async (req, res) => {
  console.log("post body", req.body);
  const client = new Client();
  try {
    await client.connect();
    const sql1 = "SELECT title FROM books WHERE title = $1";
    const params1 = [req.body.title];
    const result = await client.query(sql1, params1);
    if (result.rows[0]) {
      console.log("Book already existed");
      return res.status(400).json({ err: "Book already existed" });
    }
    console.log("Ok you can continue");
    const sql = "INSERT INTO books(title, authors) VALUES($1, $2)";
    const params = [req.body.title, req.body.authors];
    await client.query(sql, params);
    res.redirect("/books");
  } catch (err) {
    console.log(err);
  } finally {
    await client.end();
  }
});

app.post("/book/edit/:id", async (req, res) => {
  const client = new Client();
  const { title, authors } = req.body;
  const book_id = req.params.id;
  try {
    await client.connect();
    const sql =
      "UPDATE books SET title = ($1), authors = ($2) WHERE book_id = ($3)";
    const params = [title, authors, book_id];
    await client.query(sql, params);
    res.redirect("/books");
  } catch (err) {
    console.log(err);
  } finally {
    await client.end();
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT} 😎`);
});
