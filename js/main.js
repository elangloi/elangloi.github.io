

// TODO Add skill level and prog bar
function genLanguages() {
	let languages = [
		"Answer Set Prolog",
		"C",
		"C#",
		"Java",
		"Javascript",
		"Ruby",
		"Ocaml",
		"PHP",
		"SQL",
		"SWI Prolog",
		"CSS",
		"HTML",
	];

	languages.sort().forEach((elt) => {
		document.writeln("<div class='bubble'>"+elt+"</div>");
	});
	
}

function genFrameworks() {
	let frameworks = [
		"Bootstrap",
		"Microsoft Visual Studio",
		"Android Studio",
		"Unity",
		"MySQL Workbench",
		"Processing (MIT Media Lab)",
		"Rhino 3D",
		"Maya",
		"Git",
		"Eclipse",
	];

	frameworks.sort().forEach((elt)=> {
		document.writeln("<div class='bubble'>"+elt+"</div>");
	});
}