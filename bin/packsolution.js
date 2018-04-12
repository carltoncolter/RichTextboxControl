const concat = require('concat');
const fs = require('fs-extra');
const zipper = require('zip-local');

// this is in bin
const root = __dirname + "/../";

fs.ensureDir(root+"build/solution/Controls/RichTextBoxControl/strings");

concat([root + "src/fix.js",
        root + "build/ckeditor.js", 
        root + "src/seperator.js", 
        root + "src/RichTextBoxControl.js", 
       ], 
       
       root + "build/solution/Controls/RichTextBoxControl/RichTextBoxControl.js");

function copy(src,dst)
{
        if (fs.existsSync(root+src))
        {
                fs.copySync(root+src, root+dst);
        }
}
function del(path)
{
        if (fs.existsSync(root+path))
        {
                fs.remove(root + path);
        }
}

copy('dynamics365/solution/customizations.xml','build/solution/customizations.xml');
copy('dynamics365/solution/'+'['+'Content_Types'+']'+'.xml', 'build/solution/'+'['+'Content_Types'+']'+'.xml');
copy('dynamics365/solution/solution.xml', '/build/solution/solution.xml');
//copy('dynamics365/solution/control/ControlManifest.xml', 'build/solution/Controls/RichTextBoxControl/ControlManifest.xml');
//copy('dynamics365/solution/control/strings/RichTextBoxControl.1033.resx', 'build/solution/Controls/RichTextBoxControl/strings/RichTextBoxControl.1033.resx');
copy('dynamics365/solution/control', 'build/solution/Controls/RichTextBoxControl');

const solutionZip = "build/RichTextBoxControl.zip";
del(solutionZip);
zipper.zip(root + "build/solution", function (error, zipped) {
        if (error) { console.log(error);}
        zipped.save(root + solutionZip);
        // cleanup
        // del("build/ckeditor.js");  // don't delete - it allows for testing...
        del("build/translations"); // we could probably use this to generate better strings resx...
        del("build/ckeditor.js.map"); //should we be keeping and merging the map files?
        del("src/RichTextBoxControl.js");
        del("src/RichTextBoxControl.js.map");
        del("build/solution");
});

