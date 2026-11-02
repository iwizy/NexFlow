import dns from "node:dns";
import net from "node:net";
import tls from "node:tls";
import http from "node:http";
import https from "node:https";
import http2 from "node:http2";
import dgram from "node:dgram";
import {syncBuiltinESMExports} from "node:module";
const deny=()=>{process.stderr.write("NEXFLOW-PACKAGE-NETWORK-DENIED\n");throw Error("Network denied");};
for(const [object,names] of [[dns,["lookup","lookupService","resolve","resolve4","resolve6","resolveAny","reverse"]],
  [dns.promises,Object.keys(dns.promises)],[net,["connect","createConnection","createServer"]],
  [tls,["connect","createServer"]],[http,["get","request","createServer"]],
  [https,["get","request","createServer"]],[http2,["connect","createServer","createSecureServer"]],
  [dgram,["createSocket"]]])for(const name of names)if(typeof object[name]==="function")object[name]=deny;
net.Socket.prototype.connect=deny;
globalThis.fetch=deny;globalThis.WebSocket=class {constructor(){deny();}};
syncBuiltinESMExports();
