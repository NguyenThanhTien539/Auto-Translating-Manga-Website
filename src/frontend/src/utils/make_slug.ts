

export function slugify(str : string) {
   str = str.replace(/^\s+|\s+$/g, "");
   str = str.toLowerCase();

   const from = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ·/_,:;";
   const to = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd------";

    for (let i = 0; i < from.length; i++) {
        str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
    }

   str = str.trim()
   .replace(/[^a-z0-9 -]/g, "") 
   .replace(/\s+/g, "-") 
   .replace(/-+/g, "-");

   return str;
};