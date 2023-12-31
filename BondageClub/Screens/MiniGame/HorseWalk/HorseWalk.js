"use strict";
var HorseWalkBackground = "HorseStableLight";
var HorseWalkCarrots = null;
var HorseWalkCrops = null;
var HorseWalkHurdle = null;
var HorseWalkPlayerX = 0;
var HorseWalkPlayerY = 0;
var HorseWalkItemSize = 100;
var HorseWalkCollectedCarrots = 0;
var HorseWalkCollectedCrops = 0;
var HorseWalkHurdleWin = 0;
var HorseWalkHurdleFail = 0;
var HorseWalkSpeed = 1;
var HorseWalkText =""

// Generates all the Carrots
function HorseWalkGenerateCarrotItems(MaxCarrot, MaxCrop) {
	// Full the Carrots sequence
	HorseWalkCarrots = [];
	for(var S = 0; S < MaxCarrot; S++) {
		// Generates each Carrot 1 by 1
		var NewCarrot = {
			X : Math.floor(Math.random() * 1980) + 10,
			Y : Math.floor(Math.random() * 940) + 10,
		}
		HorseWalkCarrots.push(NewCarrot);
	}
	// Full the Crops sequence
	HorseWalkCrops = [];
	for(var S = 0; S < MaxCrop; S++) {
		// Generates each Carrot 1 by 1
		var NewCrop = {
			X : Math.floor(Math.random() * 1980) + 10,
			Y : Math.floor(Math.random() * 940) + 10,
		}
		HorseWalkCrops.push(NewCrop);
	}

}

// Generates all the Hurdle
function HorseWalkGenerateHurdleItems(MaxHurdle) {
	HorseWalkHurdle = [];
	for(var S = 0; S < MaxHurdle; S++) {
		// Generates each Carrot 1 by 1
		var NewHurdle = {
			X : 1000 + 800*Math.cos((Math.PI*2)/MaxHurdle*S),
			Y : 550 + 350*Math.sin((Math.PI*2)/MaxHurdle*S),
			Stat : 0 
		}
		HorseWalkHurdle.push(NewHurdle);
	}
}

// Draw the Carrots
function HorseWalkDrawItem() {
	if (MiniGameDifficulty == "Carrot") {
		for(var S = 0; S < HorseWalkCarrots.length; S++)
			DrawImage("Screens/MiniGame/HorseWalk/carrot.png", HorseWalkCarrots[S].X - (HorseWalkItemSize / 2), HorseWalkCarrots[S].Y - (HorseWalkItemSize / 2));
		for(var S = 0; S < HorseWalkCrops.length; S++)
			DrawImage("Screens/MiniGame/HorseWalk/LeatherCrop.png", HorseWalkCrops[S].X - (HorseWalkItemSize / 2), HorseWalkCrops[S].Y - (HorseWalkItemSize / 2));
	} else if (MiniGameDifficulty == "Hurdle") {
		for(var S = 0; S < HorseWalkHurdle.length; S++) {
			if (HorseWalkHurdle[S].Stat == 0) {	
				DrawImage("Screens/MiniGame/HorseWalk/hurdle_90.png", HorseWalkHurdle[S].X - (HorseWalkItemSize / 2), HorseWalkHurdle[S].Y - (HorseWalkItemSize / 2));
			} else if (HorseWalkHurdle[S].Stat == 1) {	
				DrawImage("Screens/MiniGame/HorseWalk/hurdle_90_win.png", HorseWalkHurdle[S].X - (HorseWalkItemSize / 2), HorseWalkHurdle[S].Y - (HorseWalkItemSize / 2));
			} else if (HorseWalkHurdle[S].Stat == -1) {	
				DrawImage("Screens/MiniGame/HorseWalk/hurdle_90_fail.png", HorseWalkHurdle[S].X - (HorseWalkItemSize / 2), HorseWalkHurdle[S].Y - (HorseWalkItemSize / 2));
			}
		}
	}
}

// Loads the Horse Walk mini game
function HorseWalkLoad() {

	HorseWalkBackground = "HorseStable";

	// The higher the difficulty, the more Carrots there will be (less Carrots on mobile since we cannot swipe the mouse)
	HorseWalkPlayerX = 900;
	HorseWalkPlayerY = 400;
	var Factor = (CommonIsMobile) ? 0.25 : 1;
	if (MiniGameDifficulty == "Carrot") {
		var MaxCarrot = 12 * Factor;
		HorseWalkGenerateCarrotItems(MaxCarrot, MaxCarrot);
		HorseWalkCollectedCarrots = 0;
		HorseWalkCollectedCrops = 0;
	} else if (MiniGameDifficulty == "Hurdle") {
		var MaxHurdle = 12 * Factor;
		HorseWalkGenerateHurdleItems(MaxHurdle);
		HorseWalkHurdleWin = 0;
		HorseWalkHurdleFail = 0;
	}
	MiniGameTimer = CommonTime() + 40000;
	HorseWalkSpeed = 1 + SkillGetLevel(Player, "Dressage")/5;
}

// Run the mini game
function HorseWalkRun() {

	// The game ends in victory if the time runs out
	var Time = CommonTime();
	if (!MiniGameEnded && (Time >= MiniGameTimer)){
		if (MiniGameDifficulty == "Carrot") {
			if (HorseWalkCollectedCarrots > HorseWalkCollectedCrops) {
				var HorseWalkSkillProgress = (HorseWalkCollectedCarrots - HorseWalkCollectedCrops) * 5;
				SkillProgress("Dressage",  HorseWalkSkillProgress);
				HorseWalkEnd(true);
			} else {
				HorseWalkEnd(false);
			}
		} else if (MiniGameDifficulty == "Hurdle") {
			if (HorseWalkHurdleWin > 0 && HorseWalkHurdleFail < 1) {
				var HorseWalkSkillProgress = HorseWalkHurdleWin * 6;
				SkillProgress("Dressage",  HorseWalkSkillProgress);
				HorseWalkEnd(true);
			} else if (HorseWalkHurdleWin > HorseWalkHurdleFail) {
				var HorseWalkSkillProgress = HorseWalkHurdleWin * 4;
				SkillProgress("Dressage",  HorseWalkSkillProgress);
				HorseWalkEnd(true);
			} else {
				var HorseWalkSkillProgress = HorseWalkHurdleWin * 2;
				SkillProgress("Dressage",  HorseWalkSkillProgress);
				HorseWalkEnd(false);
			}
		}
	}
	if (Time >= MiniGameTimer + 5000) CommonDynamicFunction(MiniGameReturnFunction + "()");

	// Draw the player character, progress bar and text
	HorseWalkDoMove();
	DrawCharacter(Player, HorseWalkPlayerX, HorseWalkPlayerY, 0.4);
	HorseWalkDrawItem();
	if (!MiniGameEnded) DrawProgressBar(0, 950, 2000, 50, (MiniGameTimer - Time) / 400);
	else DrawRect(0, 950, 2000, 50, "white");
	if (Time < MiniGameTimer) {
		if (MiniGameDifficulty == "Carrot") {
			HorseWalkText = TextGet("HorseWalkCarrotSpots");
			HorseWalkText = HorseWalkText.replace("$CARROTS", HorseWalkCollectedCarrots).replace("$CROPS", HorseWalkCollectedCrops);
		} else if (MiniGameDifficulty == "Hurdle") {
			HorseWalkText = TextGet("HorseWalkHurdleSpots");
			HorseWalkText = HorseWalkText.replace("$HURDLEWIN", HorseWalkHurdleWin).replace("$HURDLEFAIL", HorseWalkHurdleFail);
		}
	} else {
		if (MiniGameDifficulty == "Carrot") {
			HorseWalkText = TextGet(MiniGameVictory ? "CarrotVictory" : "CarrotDefeat");
			HorseWalkText = HorseWalkText.replace("$CARROTS", HorseWalkCollectedCarrots).replace("$CROPS", HorseWalkCollectedCrops);
		} else if (MiniGameDifficulty == "Hurdle") {
			HorseWalkText = TextGet(MiniGameVictory ? "HurdleVictory" : "HurdleDefeat");
			HorseWalkText = HorseWalkText.replace("$HURDLEWIN", HorseWalkHurdleWin).replace("$HURDLEFAIL", HorseWalkHurdleFail);
		}
	}
	DrawText(HorseWalkText, 1000, 977, "black", "white");
}

// Ends the game and sends the result back to the screen
function HorseWalkEnd(Victory) {
	MiniGameVictory = Victory;
	MiniGameEnded = true;
	MiniGameTimer = CommonTime();
}

// When the user clicks in the horse walk game
function HorseWalkDoMove() {

	// If the position changed
	if (((HorseWalkPlayerX != MouseX - 100) || (HorseWalkPlayerY != MouseY - 100)) && (MouseX >= 0) && (MouseY >= 0)) {
		
		if ( HorseWalkPlayerX > (MouseX - 100 + HorseWalkSpeed) ) {
			HorseWalkPlayerX -= HorseWalkSpeed;
		} else if ( HorseWalkPlayerX < (MouseX - 100 - HorseWalkSpeed) ){
			HorseWalkPlayerX += HorseWalkSpeed;
		} else {
			HorseWalkPlayerX = MouseX - 100;
		}

		if ( HorseWalkPlayerY > (MouseY - 100 + HorseWalkSpeed) ) {
			HorseWalkPlayerY -= HorseWalkSpeed;
		} else if ( (HorseWalkPlayerY) < (MouseY - 100 - HorseWalkSpeed) ){
			HorseWalkPlayerY += HorseWalkSpeed;
		} else {
			HorseWalkPlayerY = MouseY - 100;
		}

		var Range = ((CommonIsMobile) ? (HorseWalkItemSize / 1.5) : (HorseWalkItemSize / 2));

		// If the game has started, we check the click position and remove a Item at that position
		if (!MiniGameEnded){
			if (MiniGameDifficulty == "Carrot") {
				for(var S = 0; S < HorseWalkCarrots.length; S++){
					if (((HorseWalkPlayerX+100) >= HorseWalkCarrots[S].X - Range) && ((HorseWalkPlayerX+100) <= HorseWalkCarrots[S].X + Range) && ((HorseWalkPlayerY+100) >= HorseWalkCarrots[S].Y - Range) && ((HorseWalkPlayerY+100) <= HorseWalkCarrots[S].Y + Range)) {
						HorseWalkCarrots.splice(S, 1);
						HorseWalkCollectedCarrots++;
						return;
					}
				}
				for(var S = 0; S < HorseWalkCrops.length; S++){
					if (((HorseWalkPlayerX+100) >= HorseWalkCrops[S].X - Range) && ((HorseWalkPlayerX+100) <= HorseWalkCrops[S].X + Range) && ((HorseWalkPlayerY+100) >= HorseWalkCrops[S].Y - Range) && ((HorseWalkPlayerY+100) <= HorseWalkCrops[S].Y + Range)) {
						HorseWalkCrops.splice(S, 1);
						HorseWalkCollectedCrops++;
						return;
					}
				}
			} else if (MiniGameDifficulty == "Hurdle") {
				for(var S = 0; S < HorseWalkHurdle.length; S++){
					if (((HorseWalkPlayerX+100) >= HorseWalkHurdle[S].X - Range) && ((HorseWalkPlayerX+100) <= HorseWalkHurdle[S].X + Range) && ((HorseWalkPlayerY+300) >= HorseWalkHurdle[S].Y - Range) && ((HorseWalkPlayerY+300) <= HorseWalkHurdle[S].Y + Range) && HorseWalkHurdle[S].Stat == 0) {
						if ((Math.random() * Math.random() * 10) < SkillGetLevel(Player, "Dressage")) {
							HorseWalkHurdle[S].Stat = 1;
							HorseWalkHurdleWin++;
						} else {
							HorseWalkHurdle[S].Stat = -1;
							HorseWalkHurdleFail++;
						}
						return;
					}
				}

			}			
		}
	}

}

// On mobile, we need to move the player on click
function HorseWalkClick() {
	if (CommonIsMobile) HorseWalkDoMove();
}