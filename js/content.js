//------------------ KARTE 1 -----------------------
let header_card_1_A = "<strong> FBR </strong>";
let header_card_1_B = "<strong> Fachbereichsrat </strong>";
let content_card_1_A = "Der <strong> FBR </strong> ist das höchste Gremium am Fachbereich 07 und setzt sich aus den beiden" +
    "Instituten Sport und Psychologie zusammen. Hier wird über alle wichtigen" +
    "Entscheidungen wie z.B. neue ProfessorInnen etc. abgestimmt. (Beschlussfassendes" +
    "Organ)";
let content_card_1_B = "Der <strong> FBR </strong> ist das höchste Gremium am Fachbereich 07 und setzt sich aus den beiden" +
    "Instituten Sport und Psychologie zusammen. Hier wird über alle wichtigen" +
    "Entscheidungen wie z.B. neue ProfessorInnen etc. abgestimmt. (Beschlussfassendes" +
    "Organ)";


//------------------ KARTE 2 -----------------------
let header_card_2_A = "<strong> KLsA </strong>";
let header_card_2_B = "<strong> Kommission für Lehre und studentische Angelegenheiten </strong>";
let content_card_2_A = "Die <strong> KLsA </strong> beschäftigt sich mit jeglichen studentischen Angelegenheiten, wie z.B." +
    "Lehrangebot der nächsten Semester, Stellenausschreibungen und -besetzungen, etc." +
    "(Beratendes Gremium für den StuBei)";
let content_card_2_B = "Die <strong> KLsA </strong> beschäftigt sich mit jeglichen studentischen Angelegenheiten, wie z.B." +
    "Lehrangebot der nächsten Semester, Stellenausschreibungen und -besetzungen, etc." +
    "(Beratendes Gremium für den StuBei)";

let headers = [header_card_1_A, header_card_1_B, header_card_2_A, header_card_2_B];

let contents = [content_card_1_A, content_card_1_B, content_card_2_A, content_card_2_B];

let ids = [];

for(let i = 0; i < contents.length; i++){
    ids.push(i);
}