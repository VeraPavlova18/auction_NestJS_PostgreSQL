// tslint:disable:no-unused-expression

export async function deleteFromTables({ bid, lot, user, order }: any) {
  order && await order.query(`DELETE FROM "order";`);
  bid && await bid.query(`DELETE FROM "bid";`);
  lot && await lot.query(`DELETE FROM "lot";`);
  user && await user.query(`DELETE FROM "user";`);
}
