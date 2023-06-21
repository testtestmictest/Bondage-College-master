"use strict";
var CheatBackground = "Sheet";
var CheatAllow = false;
var CheatList = ["DoubleReputation", "DoubleSkill", "DoubleMoney", "DoubleItemSpeed", "BlockRandomKidnap", "SkipTrialPeriod"];
var CheatBonusList = ["DoubleMoney", "DoubleSkill"];
var CheatBonusFactor = 2;
var CheatBonusTime = 1551928838188;
var CheatActivated = [];

// Returns TRUE if the cheat is currently active
function CheatActive(CheatName) {
	return (CheatAllow && (CheatActivated.indexOf(CheatName) >= 0));
}

// Returns the factor if the cheat is activated (also multiply the bonus factor if it's active)
function CheatFactor(CheatName, Factor) {
	Factor = (CheatAllow && (CheatActivated.indexOf(CheatName) >= 0)) ? Factor : 1;
	if ((CheatBonusTime >= CurrentTime) && (CheatBonusList.indexOf(CheatName) >= 0)) Factor = Factor * CheatBonusFactor;
	return Factor;
}

// Imports the cheats from the local storage
function CheatImport() {
	CheatAllow = true;
	for(var C = 0; C < CheatList.length; C++) {
		var AC = localStorage.getItem("BondageClubCheat" + CheatList[C]);
		if ((AC != null) && (AC.toUpperCase() == "TRUE")) CheatActivated.push(CheatList[C]);
	}
}

// Exports the cheats to the local storage
function CheatExport() {
	for(var C = 0; C < CheatList.length; C++)
		localStorage.setItem("BondageClubCheat" + CheatList[C], (CheatActivated.indexOf(CheatList[C]) >= 0) ? "true" : "false");
}

// Run the character info screen
function CheatRun() {

	// List all the cheats
	MainCanvas.textAlign = "left";
	for(var C = 0; C < CheatList.length; C++) {
		DrawButton(150, 150 + (C * 100), 64, 64, "", "White", CheatActive(CheatList[C]) ? "Icons/Checked.png" : "");
		DrawText(TextGet(CheatList[C]), 250, 182 + (C * 100), "Black", "Gray");		
	}

	// Draw the exit button
	MainCanvas.textAlign = "center";
	DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png");

}

// When the user clicks on the character info screen
function CheatClick() {
	
	// When the user exits
	if ((MouseX >= 1815) && (MouseX < 1905) && (MouseY >= 75) && (MouseY < 165)) {
		CheatExport();
		CommonSetScreen("Character", "Login");	
	}
	
	// When the user activates an option
	for(var C = 0; C < CheatList.length; C++)
		if ((MouseX >= 150) && (MouseX <= 800) && (MouseY >= 150 + (C * 100)) && (MouseY <= 214 + (C * 100))) {
			var CheatName = CheatList[C];
			if (CheatActivated.indexOf(CheatName) >= 0)
				CheatActivated.splice(CheatActivated.indexOf(CheatName), 1);
			else
				CheatActivated.push(CheatName);
			return;
		}

}