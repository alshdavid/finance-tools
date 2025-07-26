import * as ejs from "ejs";
import * as path from "node:path";
import * as fs from "node:fs";
import * as url from "node:url";
import * as esbuild from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
import * as prettier from "prettier";
import crypto from "node:crypto";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));
const BASE_HREF = process.env.BASE_HREF || "/";

const Paths = {
  dirname,
  src: path.join(dirname, "src"),
  srcRobots: path.join(dirname, "src", "robots.txt"),
  srcStatic: path.join(dirname, "src", "static"),
  dist: path.join(dirname, "dist"),
  distRobots: path.join(dirname, "dist", "robots.txt"),
  distStatic: path.join(dirname, "dist", "static"),
};

if (fs.existsSync(Paths.dist)) {
  fs.rmSync(Paths.dist, { recursive: true, force: true });
}

const scripts = new Set<string>();
const styles = new Set<string>();

for (const file of fs.readdirSync(Paths.src, {
  withFileTypes: true,
  recursive: true,
})) {
  if (!file.isFile()) continue;
  if (file.name !== "index.ejs" && file.name !== "404.ejs") continue;
  const completePath = path.join(file.parentPath, file.name);
  const dirname = path.relative(Paths.src, file.parentPath);
  const filename = path.join(dirname, file.name);
  console.log(filename);

  const ctx = {
    base_href: BASE_HREF,
    styles: {
      include: (p: string) =>
        styles.add(path.normalize(path.join(Paths.src, dirname, p))),
    },
    scripts: {
      include(script: string) {
        scripts.add(path.normalize(path.join(Paths.src, dirname, script)));
      },
    },
    get ctx() {
      return this;
    },
  };

  const parsed = path.parse(completePath);
  const ejsCode = fs.readFileSync(completePath, "utf8");
  let result = await ejs.render(ejsCode, ctx, {
    async: true,
    cache: false,
    filename: completePath,
  });
}

const report = await esbuild.build({
  entryPoints: [...Array.from(scripts), ...Array.from(styles)],
  minify: true,
  metafile: true,
  format: "esm",
  bundle: true,
  define: {
    BASE_HREF: JSON.stringify(BASE_HREF),
  },
  sourcemap: undefined,
  outdir: Paths.dist,
  write: false,
  sourceRoot: Paths.src,
  plugins: [sassPlugin()],
  alias: {
    react: "preact/compat",
    "react-dom": "preact/compat",
  },
});

const outputMap = new Map<string, string>();

for (const [_outputPath, outputMeta] of Object.entries(report.outputFiles)) {
  if (outputMeta.path.endsWith(".map")) {
    continue;
  }
  const { name, ext, base } = path.parse(outputMeta.path);
  const hash = (await sha1(outputMeta.contents)).substring(0, 10);
  const fileName = `${name}.${hash}${ext}`;
  const filePath = outputMeta.path.replace(base, fileName)

  for (const [relPath, meta] of Object.entries(report.metafile.outputs)) {
    if (meta.entryPoint && outputMeta.path.endsWith(relPath)) {
      outputMap.set(path.join(Paths.dirname, meta.entryPoint), filePath.replace(Paths.dist + '/', ''))
      break
    }
  }

  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }
  fs.writeFileSync(filePath, outputMeta.contents);
}


for (const file of fs.readdirSync(Paths.src, {
  withFileTypes: true,
  recursive: true,
})) {
  if (!file.isFile()) continue;
  if (file.name !== "index.ejs" && file.name !== "404.ejs") continue;
  const completePath = path.join(file.parentPath, file.name);
  const dirname = path.relative(Paths.src, file.parentPath);
  const filename = path.join(dirname, file.name);

  const ctx = {
    base_href: BASE_HREF,
    styles: {
      include: (styles: string) => {
        const p = path.normalize(path.join(Paths.src, dirname, styles));
        return outputMap.get(p)
      },
    },
    scripts: {
      include(scripts: string) {
        const p = path.normalize(path.join(Paths.src, dirname, scripts));
        return outputMap.get(p)
      },
    },
    get ctx() {
      return this;
    },
  };

  const parsed = path.parse(completePath);
  const ejsCode = fs.readFileSync(completePath, "utf8");
  let result = await ejs.render(ejsCode, ctx, {
    async: true,
    cache: false,
    filename: completePath,
  });
  const prettyResult = await prettier.format(result, { parser: "html" });
  const outputPath = path.join(Paths.dist, dirname, `${parsed.name}.html`);
  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }
  fs.writeFileSync(
    path.join(Paths.dist, dirname, `${parsed.name}.html`),
    prettyResult,
    "utf8"
  );
}

if (fs.existsSync(Paths.srcRobots)) {
  fs.cpSync(Paths.srcRobots, Paths.distRobots, { recursive: true });
}
if (fs.existsSync(Paths.srcStatic)) {
  fs.cpSync(Paths.srcStatic, Paths.distStatic, { recursive: true });
}

// const Paths = {
//   Src: path.join(__dirname, "src"),
//   Index: path.join(__dirname, "src", "index.tsx"),
//   Static: path.join(__dirname, "src", "static"),
//   Robots: path.join(__dirname, "src", "robots.txt"),
//   Styles: path.join(__dirname, "src", "index.scss"),
//   Output: path.join(__dirname, "dist"),
//   OutputStatic: path.join(__dirname, "dist", "static"),
//   OutputRobots: path.join(__dirname, "dist", "robots.txt"),
// };

// fs.rmSync(Paths.Output, { recursive: true, force: true });
// fs.mkdirSync(Paths.Output, { recursive: true });

// // const stylesCode = fs.readFileSync(Paths.Styles, 'utf8')
// // const stylesResults = await sass.compileStringAsync(stylesCode, {
// //     url: url.pathToFileURL(Paths.Styles),
// // })

// const report = await esbuild.build({
//   entryPoints: [Paths.Index],
//   minify: true,
//   metafile: true,
//   format: "esm",
//   bundle: true,
//   define: {
//     BASE_HREF: JSON.stringify(BASE_HREF),
//   },
//   sourcemap: "external",
//   outdir: Paths.Output,
//   write: false,
//   plugins: [sassPlugin()],
//   alias: {
//     react: "preact/compat",
//     "react-dom": "preact/compat",
//   },
// });

// const scripts = new Map<string, string>();
// const styles = new Map<string, string>();
// const outputs = new Map<string, Uint8Array>();
// const outputMap = new Map<string, string>();

// for (const outputFile of report.outputFiles) {
//   if (outputFile.path.endsWith(".map")) {
//     continue;
//   }
//   const { name, ext, base } = path.parse(outputFile.path);
//   const hash = (await sha1(outputFile.contents)).substring(0, 10);
//   const fileName = `${name}.${hash}${ext}`;
//   outputs.set(fileName, outputFile.contents);
//   outputMap.set(base, fileName);
//   if (ext === ".js") {
//     scripts.set(base, fileName);
//   }
//   if (ext === ".css") {
//     styles.set(base, fileName);
//   }
// }

// for (const outputFile of report.outputFiles) {
//   if (!outputFile.path.endsWith(".map")) {
//     continue;
//   }
//   const nameWithoutMap = outputFile.path.substring(
//     0,
//     outputFile.path.length - 4
//   );
//   const { base } = path.parse(nameWithoutMap);
//   const relatedName = outputMap.get(base);
//   if (!relatedName) throw new Error("Unable to find map for file");
//   const fileName = `${relatedName}.map`;
//   outputs.set(fileName, outputFile.contents);
// }

// for (const [fileName, bytes] of [...outputs.entries()]) {
//   fs.writeFileSync(path.join(Paths.Output, fileName), bytes);
// }
// fs.writeFileSync(
//   path.join(Paths.Output, "meta.json"),
//   JSON.stringify(report.metafile)
// );
// fs.cpSync(Paths.Static, Paths.OutputStatic, { recursive: true });
// fs.cpSync(Paths.Robots, Paths.OutputRobots, { recursive: true });

// const ctx = {
//   scripts,
//   styles,
//   base_href: BASE_HREF,
//   get ctx() {
//     return this;
//   },
// };

// for (const file of fs.readdirSync(Paths.Src)) {
//   if (!file.endsWith(".ejs")) continue;
//   const filePath = path.join(Paths.Src, file);
//   const parsed = path.parse(filePath);
//   const ejsCode = fs.readFileSync(filePath, "utf8");
//   let result = await ejs.render(ejsCode, ctx, {
//     async: true,
//     cache: false,
//     filename: filePath,
//   });
//   const prettyResult = await prettier.format(result, { parser: "html" });
//   fs.writeFileSync(path.join(Paths.Output, `${parsed.name}.html`), prettyResult, "utf8");
// }

export async function sha1(input: any): Promise<string> {
  return crypto.createHash("sha1").update(input).digest("hex");
}
