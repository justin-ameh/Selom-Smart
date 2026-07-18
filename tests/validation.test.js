const test = require("node:test");
const assert = require("node:assert/strict");
const { orderSchema, productSchema } = require("../src/server");

test("une commande valide est acceptée", () => {
  const result = orderSchema.safeParse({ customerName:"Ama Mensah", phone:"+22899234616", email:"", city:"Lomé", address:"Tokoin, près du marché", paymentMethod:"flooz", items:[{ productId:1, quantity:1 }] });
  assert.equal(result.success, true);
});
test("une commande sans produit est refusée", () => {
  const result = orderSchema.safeParse({ customerName:"Ama Mensah", phone:"99234616", email:"", city:"Lomé", address:"Tokoin", paymentMethod:"tmoney", items:[] });
  assert.equal(result.success, false);
});
test("un prix négatif est refusé dans l’administration", () => {
  const result = productSchema.safeParse({ name:"Téléphone test", slug:"telephone-test", brand:"Test", category:"Premium", price:-1, stock:2, description:"Une description suffisamment longue." });
  assert.equal(result.success, false);
});
test("un slug dangereux est refusé", () => {
  const result = productSchema.safeParse({ name:"Téléphone test", slug:"../pirate", brand:"Test", category:"Premium", price:1000, stock:2, description:"Une description suffisamment longue." });
  assert.equal(result.success, false);
});
