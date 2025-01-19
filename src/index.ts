import colors from "colors";
import server from "./server";

const port = process.env.PORT || 4000;
//RElacion de 1 a N
server.listen(port, () => {
  console.log(colors.cyan.bold(`REST API en el puerto ${port}`));
});
