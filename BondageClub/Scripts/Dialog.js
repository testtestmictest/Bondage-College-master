"use strict";
var DialogText = "";
var DialogTextDefault = "";
var DialogTextDefaultTimer = -1;
var DialogProgress = -1;
var DialogProgressStruggleCount = 0;
var DialogProgressAuto = 0;
var DialogProgressClick = 0;
var DialogProgressOperation = "...";
var DialogProgressPrevItem = null;
var DialogProgressNextItem = null;
var DialogProgressSkill = 0;
var DialogProgressLastKeyPress = 0;
var DialogInventory = [];

function DialogReputationLess(RepType, Value) { return (ReputationGet(RepType) <= Value); } // Returns TRUE if a specific reputation type is less or equal than a given value
function DialogReputationGreater(RepType, Value) { return (ReputationGet(RepType) >= Value); } // Returns FALSE if a specific reputation type is greater or equal than a given value
function DialogMoneyGreater(Amount) { return (parseInt(Player.Money) >= parseInt(Amount)); } // Returns TRUE if the player has enough money
function DialogChangeMoney(Amount) { CharacterChangeMoney(Player, Amount); } // Change the player money amount
function DialogSetReputation(RepType, Value) { ReputationChange(RepType, (parseInt(ReputationGet(RepType)) * -1) + parseInt(Value)); } // Sets a fixed number for the player specific reputation
function DialogChangeReputation(RepType, Value) { ReputationProgress(RepType, Value); } // Change the player reputation progressively through dialog options (a reputation is easier to break than to build)
function DialogWearItem(AssetName, AssetGroup) { InventoryWear(Player, AssetName, AssetGroup); } // Equips a specific item on the player from dialog
function DialogWearRandomItem(AssetGroup) { InventoryWearRandom(Player, AssetGroup); } // Equips a random item from a given group to the player from dialog
function DialogRemoveItem(AssetGroup) { InventoryRemove(Player, AssetGroup); } // Removes an item of a specific item group from the player 
function DialogRelease(C) { CharacterRelease((C.toUpperCase().trim() == "PLAYER") ? Player : CurrentCharacter); } // Releases a character from restraints
function DialogNaked(C) { CharacterNaked((C.toUpperCase().trim() == "PLAYER") ? Player : CurrentCharacter); } // Strips a character naked and removes the restrains
function DialogFullRandomRestrain(C) { CharacterFullRandomRestrain((C.toUpperCase().trim() == "PLAYER") ? Player : CurrentCharacter); } // Strips a character naked and removes the restrains
function DialogLogQuery(LogType, LogGroup) { return LogQuery(LogType, LogGroup); } // Returns TRUE if a specific log is registered
function DialogAllowItem(Allow) { return CurrentCharacter.AllowItem = (Allow.toUpperCase().trim() == "TRUE"); } // Sets the AllowItem flag on the current character
function DialogIsKneeling(C) { return (C.toUpperCase().trim() == "PLAYER") ? Player.IsKneeling() : CurrentCharacter.IsKneeling() }
function DialogIsOwner() { return (CurrentCharacter.Name == Player.Owner.replace("NPC-", "")) }
function DialogIsProperty() { return (CurrentCharacter.Owner == Player.Name) }
function DialogIsRestrained(C) { return ((C.toUpperCase().trim() == "PLAYER") ? Player.IsRestrained() : CurrentCharacter.IsRestrained()) }
function DialogCanInteract(C) { return ((C.toUpperCase().trim() == "PLAYER") ? Player.CanInteract() : CurrentCharacter.CanInteract()) }
function DialogSetPose(C, NewPose) { CharacterSetActivePose((C.toUpperCase().trim() == "PLAYER") ? Player : CurrentCharacter, ((NewPose != null) && (NewPose != "")) ? NewPose : null); }

// Returns TRUE if the dialog prerequisite condition is met
function DialogPrerequisite(D) {
	if (CurrentCharacter.Dialog[D].Prerequisite == null)
		return true;
	else
		if (CurrentCharacter.Dialog[D].Prerequisite.indexOf("Player.") == 0)
			return Player[CurrentCharacter.Dialog[D].Prerequisite.substring(7, 250).replace("()", "").trim()]();
		else 
			if (CurrentCharacter.Dialog[D].Prerequisite.indexOf("!Player.") == 0)
				return !Player[CurrentCharacter.Dialog[D].Prerequisite.substring(8, 250).replace("()", "").trim()]();
			else
				if (CurrentCharacter.Dialog[D].Prerequisite.indexOf("(") >= 0)
					return CommonDynamicFunctionParams(CurrentCharacter.Dialog[D].Prerequisite);
				else
					if (CurrentCharacter.Dialog[D].Prerequisite.substring(0, 1) != "!")
						return window[CurrentScreen + CurrentCharacter.Dialog[D].Prerequisite.trim()];
					else
						return !window[CurrentScreen + CurrentCharacter.Dialog[D].Prerequisite.substr(1, 250).trim()];
}

// Searches for an item in the player inventory to unlock a specific item
function DialogCanUnlock(C) {
	var UnlockName = "Unlock-" + CharacterAppearanceGetCurrentValue(C, C.FocusGroup.Name, "Name");	
	for (var I = 0; I < Player.Inventory.length; I++)
		if ((Player.Inventory[I].Asset.Effect != null) && (Player.Inventory[I].Asset.Effect.indexOf(UnlockName) >= 0))
			return true;
	return false;
}

// Returns the current character dialog intro
function DialogIntro() {
	for(var D = 0; D < CurrentCharacter.Dialog.length; D++)
		if ((CurrentCharacter.Dialog[D].Stage == CurrentCharacter.Stage) && (CurrentCharacter.Dialog[D].Option == null) && (CurrentCharacter.Dialog[D].Result != null) && DialogPrerequisite(D))
			return CurrentCharacter.Dialog[D].Result;
	return "";
}

// Generic dialog function to leave conversation
function DialogLeave() {
	Player.FocusGroup = null;
	CurrentCharacter.FocusGroup = null;
	DialogInventory = null;
	CurrentCharacter = null;
}

// Generic dialog function to remove a piece of the conversation that's already done
function DialogRemove() {

	// Finds the dialog spot and removes it
	var pos = 0;
	for(var D = 0; D < CurrentCharacter.Dialog.length; D++)
		if ((CurrentCharacter.Dialog[D].Stage == CurrentCharacter.Stage) && (CurrentCharacter.Dialog[D].Option != null) && DialogPrerequisite(D)) {
			if ((MouseX >= 1025) && (MouseX <= 1975) && (MouseY >= 160 + pos * 105) && (MouseY <= 240 + pos * 105)) {
				CurrentCharacter.Dialog.splice(D, 1);
				break;
			}
			pos++;
		}

}

// Leaves the item menu for both characters
function DialogLeaveItemMenu() {
	Player.FocusGroup = null;
	CurrentCharacter.FocusGroup = null;
	DialogInventory = null;
	DialogProgress = -1;
}

// Adds the item in the dialog list
function DialogInventoryAdd(NewInv, NewInvWorn) {

	// Make sure we do not duplicate the item
	for(var I = 0; I < DialogInventory.length; I++)
		if ((DialogInventory[I].Asset.Group.Name == NewInv.Group.Name) && (DialogInventory[I].Asset.Name == NewInv.Name))
			return;
		
	// Creates a new dialog inventory item
	var DI = {
		Asset: NewInv,
		Worn: NewInvWorn,
		Icon: ""
	};

	// Loads the correct icon and push the item in the array
	if (NewInvWorn && (NewInv.Effect != null) && (NewInv.Effect.indexOf("Lock") >= 0)) DI.Icon = "Locked";
	if (!NewInvWorn && (NewInv.Effect != null) && (NewInv.Effect.indexOf("Lock") >= 0)) DI.Icon = "Unlocked";
	DialogInventory.push(DI);

}

// Build the inventory listing for the dialog which is what's equipped, the player inventory and the character inventory for that group
function DialogInventoryBuild(C) {

	// Make sure there's a focused group
	DialogInventory = [];
	if (C.FocusGroup != null) {

		// First, we add anything that's currently equipped
		for(var A = 0; A < C.Appearance.length; A++)
			if (C.Appearance[A].Asset.Group.Name == C.FocusGroup.Name)
				DialogInventoryAdd(C.Appearance[A].Asset, true);

		// Second, we add everything from the victim inventory
		for(var A = 0; A < C.Inventory.length; A++)
			if ((C.Inventory[A].Asset != null) && (C.Inventory[A].Asset.Group.Name == C.FocusGroup.Name))
				DialogInventoryAdd(C.Inventory[A].Asset, false);
			
		// Third, we add everything from the player inventory if the player isn't the victim
		if (C.ID != 0)
			for(var A = 0; A < Player.Inventory.length; A++)
				if ((Player.Inventory[A].Asset != null) && (Player.Inventory[A].Asset.Group.Name == C.FocusGroup.Name))
					DialogInventoryAdd(Player.Inventory[A].Asset, false);

	}

}

// Gets the correct label for the current operation (struggling, removing, swaping, adding, etc.)
function DialogProgressGetOperation(PrevItem, NextItem) {
	if ((PrevItem != null) && (NextItem != null)) return DialogFind(Player, "Swapping");
	if ((PrevItem != null) && (PrevItem.Asset != null) && (PrevItem.Asset.Effect != null) && (Player.FocusGroup != null) && (PrevItem.Asset.Effect.indexOf("Struggle") >= 0)) return DialogFind(Player, "Struggling");
	if ((PrevItem != null) && (PrevItem.Asset != null) && (PrevItem.Asset.Effect != null) && (PrevItem.Asset.Effect.indexOf("Lock") >= 0)) return DialogFind(Player, "Unlocking");
	if (PrevItem != null) return DialogFind(Player, "Removing");
	if ((PrevItem == null) && (NextItem != null) && (NextItem.Asset != null) && (NextItem.Asset.Effect != null) && (NextItem.Asset.Effect.indexOf("Lock") >= 0)) return DialogFind(Player, "Locking");
	if ((PrevItem == null) && (NextItem != null)) return DialogFind(Player, "Adding");
	return "...";
}

// Starts the dialog progress bar and keeps the items that needs to be added / swaped / removed
function DialogStruggle(Reverse) {
	if (DialogProgressAuto >= 0)
		DialogProgress = DialogProgress + DialogProgressClick * (Reverse ? -1 : 1);
	else
		DialogProgress = DialogProgress + DialogProgressClick * (Reverse ? -1 : 1) + ((100 - DialogProgress) / 50);
	if (DialogProgress < 0) DialogProgress = 0;
	DialogProgressStruggleCount++;
	if ((DialogProgressStruggleCount >= 50) && (DialogProgressClick == 0)) DialogProgressOperation = DialogFind(Player, "Impossible");
}

// Starts the dialog progress bar and keeps the items that needs to be added / swaped / removed
function DialogProgressStart(C, PrevItem, NextItem) {
	
	// Gets the standard time to do the operation (minimum 1 second) and the player skill level associated
	var Timer = 0;
	var S = 0;
	if (PrevItem != null) {
		if ((PrevItem.Asset != null) && (PrevItem.Asset.RemoveTime != null)) Timer = Timer + PrevItem.Asset.RemoveTime;
		if (C.ID == 0) {
			S = S + SkillGetLevel(Player, "Evasion");
			if (PrevItem.Difficulty != null) S = S - PrevItem.Difficulty;
			if (!C.CanInteract() || (C.Effect.indexOf("Suspension") >= 0)) Timer = Timer * 2;
		}
	}
	if ((NextItem != null) && (NextItem.Asset != null) && (NextItem.Asset.WearTime != null)) Timer = Timer + NextItem.Asset.WearTime;
	if ((C.ID != 0) || ((C.ID == 0) && (PrevItem == null))) S = S + SkillGetLevel(Player, "Bondage");
	if (Timer < 1) Timer = 1;
	if (Player.IsBlind()) Timer = Timer * 2;

	// Prepares the progress bar and timer
	DialogProgress = 0;
	DialogProgressAuto = CommonRunInterval * (0.1333 + (S * 0.1333)) / (Timer * CheatFactor("DoubleItemSpeed", 0.5));
	DialogProgressClick = CommonRunInterval * 2.5 / (Timer * CheatFactor("DoubleItemSpeed", 0.5));
	if (S < 0) { DialogProgressAuto = DialogProgressAuto / 2; DialogProgressClick = DialogProgressClick / 2; }
	DialogProgressPrevItem = PrevItem;
	DialogProgressNextItem = NextItem;
	DialogProgressOperation = DialogProgressGetOperation(PrevItem, NextItem);
	DialogProgressSkill = Timer;
	DialogProgressLastKeyPress = 0;
	DialogProgressStruggleCount = 0;

	// Struggling in negative only comes if there's a struggling option
	if ((DialogProgressAuto < 0) && (PrevItem != null) && ((PrevItem.Asset.Effect == null) || (PrevItem.Asset.Effect.indexOf("Struggle") < 0))) DialogProgressAuto = 0;
	
	// At a level difficulty level beyond 6, there's no possible struggling
	if ((PrevItem != null) && (PrevItem.Asset.Effect != null) && (PrevItem.Asset.Effect.indexOf("Struggle") >= 0) && (S <= -6)) DialogProgressClick = 0;
	
}

// The player can use the space bar to speed up the dialog progress, just like clicking
function DialogKeyDown() {
	if (((KeyPress == 65) || (KeyPress == 83) || (KeyPress == 97) || (KeyPress == 115)) && (DialogProgress >= 0)) {
		DialogStruggle((DialogProgressLastKeyPress == KeyPress));
		DialogProgressLastKeyPress = KeyPress;
	}
}

// When the user clicks on a dialog option
function DialogClick() {

	// If the user clicked on the interaction character or herself, we check to use an item 
	if ((CurrentCharacter.AllowItem || (MouseX < 500)) && (MouseX >= 0) && (MouseX <= 1000) && (MouseY >= 0) && (MouseY < 1000) && ((CurrentCharacter.ID != 0) || (MouseX > 500)) && (DialogIntro() != "")) {
		DialogLeaveItemMenu();
		var C = (MouseX < 500) ? Player : CurrentCharacter;
		var X = (MouseX < 500) ? 0 : 500;
		for(var A = 0; A < AssetGroup.length; A++)
			if ((AssetGroup[A].Category == "Item") && (AssetGroup[A].Zone != null))
				for(var Z = 0; Z < AssetGroup[A].Zone.length; Z++)
					if (((C.Pose.indexOf("Suspension") < 0) && (MouseX - X >= AssetGroup[A].Zone[Z][0]) && (MouseY >= AssetGroup[A].Zone[Z][1] - C.HeightModifier) && (MouseX - X <= AssetGroup[A].Zone[Z][0] + AssetGroup[A].Zone[Z][2]) && (MouseY <= AssetGroup[A].Zone[Z][1] + AssetGroup[A].Zone[Z][3] - C.HeightModifier)) 
					|| ((C.Pose.indexOf("Suspension") >= 0) && (MouseX - X >= AssetGroup[A].Zone[Z][0]) && (MouseY >= 1000 - (AssetGroup[A].Zone[Z][1] + AssetGroup[A].Zone[Z][3]) - C.HeightModifier) && (MouseX - X <= AssetGroup[A].Zone[Z][0] + AssetGroup[A].Zone[Z][2]) && (MouseY <= 1000 - AssetGroup[A].Zone[Z][1] - C.HeightModifier)))
					{
						C.FocusGroup = AssetGroup[A];
						DialogInventoryBuild(C);
						DialogText = DialogTextDefault;
						break;
					}
	}

	// In item menu mode VS text dialog mode
	if (((Player.FocusGroup != null) || ((CurrentCharacter.FocusGroup != null) && CurrentCharacter.AllowItem)) && (DialogIntro() != "")) {

		// If the user wants to speed up the add / swap / remove progress
		if ((MouseX >= 1000) && (MouseX < 2000) && (MouseY >= 600) && (MouseY < 1000) && (DialogProgress >= 0) && CommonIsMobile) 
			DialogStruggle(false);
	
		// If the user removes wants to remove an item
		if ((MouseX >= 1500) && (MouseX <= 1725) && (MouseY >= 25) && (MouseY <= 100) && (DialogProgress < 0)) {

			// If the player can interact, we simply remove the item
			var C = (Player.FocusGroup != null) ? Player : CurrentCharacter;
			var Item = InventoryGet(C, C.FocusGroup.Name);
			if (Player.CanInteract()) {
				if ((C.FocusGroup != null) && (Item != null)) {

					// Do not allow to remove if it's locked
					if ((Item.Asset.Effect == null) || (Item.Asset.Effect.indexOf("Lock") < 0))
						if ((Item.Asset.Prerequisite == null) || InventoryAllow(C, Item.Asset.Prerequisite))
							if (!InventoryGroupIsBlocked(C))
								DialogProgressStart(C, Item, null);

				}
			} else {
				
				// If the player can struggle out or unlock herself
				if ((C.ID == 0) && (Item.Asset.Effect != null) && (Item.Asset.Effect.indexOf("Struggle") >= 0) && (DialogProgress == -1)) DialogProgressStart(C, Item, null);
				if ((C.ID == 0) && (Item.Asset.Effect != null) && (Item.Asset.Effect.indexOf("Block") >= 0) && (Item.Asset.Effect.indexOf("Lock") >= 0) && DialogCanUnlock(C)) DialogProgressStart(C, Item, null);

			}

		}
	
		// If the user cancels the menu
		if ((MouseX >= 1750) && (MouseX <= 1975) && (MouseY >= 25) && (MouseY <= 100))
			DialogLeaveItemMenu();

		// If the user clicks on one of the items
		if ((MouseX >= 1000) && (MouseX <= 1975) && (MouseY >= 125) && (MouseY <= 1000) && Player.CanInteract() && (DialogProgress < 0)) {

			// For each items in the player inventory
			var X = 1000;
			var Y = 125;
			var C = (Player.FocusGroup != null) ? Player : CurrentCharacter;
			for(var I = 0; I < DialogInventory.length; I++) {

				// If the item at position is clicked
				if ((MouseX >= X) && (MouseX < X + 225) && (MouseY >= Y) && (MouseY < Y + 275) && DialogInventory[I].Asset.Enable) {

					// Cannot change item if the previous one is locked or blocked by another group
					var Item = InventoryGet(C, C.FocusGroup.Name);
					if ((Item == null) || (Item.Asset.Effect == null) || (Item.Asset.Effect.indexOf("Lock") < 0)) {
						if (!InventoryGroupIsBlocked(C))
							if ((DialogInventory[I].Asset.Prerequisite == null) || InventoryAllow(C, DialogInventory[I].Asset.Prerequisite))
								if ((Item == null) || (Item.Asset.Name != DialogInventory[I].Asset.Name))
									if (DialogInventory[I].Asset.Wear) {
										if (DialogInventory[I].Asset.SelfBondage || (C.ID != 0)) DialogProgressStart(C, Item, DialogInventory[I]);
										else DialogSetText("CannotUseOnSelf");
									} else {
										C.CurrentDialog = DialogFind(C, DialogInventory[I].Asset.Group.Name + DialogInventory[I].Asset.Name);
										DialogLeaveItemMenu();
									}
					} else {

						// If the item can unlock another item or simply show dialog text (not wearable)
						if ((DialogInventory[I].Asset.Effect != null) && (DialogInventory[I].Asset.Effect.indexOf("Unlock-" + Item.Asset.Name) >= 0))
							DialogProgressStart(C, Item, null);
						else
							if (!DialogInventory[I].Asset.Wear) {
								C.CurrentDialog = DialogFind(C, DialogInventory[I].Asset.Group.Name + DialogInventory[I].Asset.Name);
								DialogLeaveItemMenu();
							}

					}
					break;

				}

				// Change the X and Y position to get the next square
				X = X + 250;
				if (X > 1800) {
					X = 1000;
					Y = Y + 300;
				}

			}

		}		

	} else {

		// If we need to leave the dialog (only allowed when there's an entry point to the dialog, not in the middle of a conversation)
		if ((DialogIntro() != "") && (DialogIntro() != "NOEXIT") && (MouseX >= 1885) && (MouseX <= 1975) && (MouseY >= 25) && (MouseY <= 110))
			DialogLeave();

		// If the user clicked on a text dialog option, we trigger it
		if ((MouseX >= 1025) && (MouseX <= 1975) && (MouseY >= 100) && (MouseY <= 975) && (CurrentCharacter != null)) {
			var pos = 0;
			for(var D = 0; D < CurrentCharacter.Dialog.length; D++)
				if ((CurrentCharacter.Dialog[D].Stage == CurrentCharacter.Stage) && (CurrentCharacter.Dialog[D].Option != null) && DialogPrerequisite(D)) {
					if ((MouseX >= 1025) && (MouseX <= 1975) && (MouseY >= 160 + pos * 105) && (MouseY <= 240 + pos * 105)) {

						// If the player is gagged, the answer will always be the same
						if (!Player.CanTalk()) CurrentCharacter.CurrentDialog = DialogFind(CurrentCharacter, "PlayerGagged");
						else CurrentCharacter.CurrentDialog = CurrentCharacter.Dialog[D].Result;
						
						// A dialog option can change the conversation stage, show text or launch a custom function						
						if ((Player.CanTalk() && CurrentCharacter.CanTalk()) || DialogFullEmote(CurrentCharacter.Dialog[D].Option)) {
							CurrentCharacter.CurrentDialog = CurrentCharacter.Dialog[D].Result;
							if (CurrentCharacter.Dialog[D].NextStage != null) CurrentCharacter.Stage = CurrentCharacter.Dialog[D].NextStage;
							if (CurrentCharacter.Dialog[D].Function != null) CommonDynamicFunctionParams(CurrentCharacter.Dialog[D].Function);
						} else 
							if ((CurrentCharacter.Dialog[D].Function != null) && (CurrentCharacter.Dialog[D].Function.trim() == "DialogLeave()"))
								DialogLeave();
						break;

					}
					pos++;
				}
		}
	
	}	

}

// Sets the dialog 5 seconds text
function DialogSetText(NewText) {
	DialogTextDefaultTimer = CommonTime() + 5000;
	DialogText = DialogFind(Player, NewText);
}

// Draw the item menu dialog
function DialogDrawItemMenu(C) {

	// Gets the default text that will reset after 5 seconds
	if (DialogTextDefault == "") DialogTextDefault = DialogFind(Player, "SelectItem");
	if (DialogTextDefaultTimer < CommonTime()) DialogText = DialogTextDefault;
	
	// Inventory is only accessible if the player can interact and there's no progress bar
	if (Player.CanInteract() && (DialogProgress < 0) && !InventoryGroupIsBlocked(C)) {

		// Builds the item dialog if we need too
		if (DialogInventory == null) DialogInventoryBuild(C);
	
		// Draws the top menu
		if ((C.FocusGroup != null) && (InventoryGet(C, C.FocusGroup.Name) != null)) {
			DrawTextWrap(DialogText, 1000, 0, 500, 125, "White");
			DrawButton(1500, 25, 225, 75, "Remove", "White");
		} else DrawTextWrap(DialogText, 1000, 0, 750, 125, "White");
		DrawButton(1750, 25, 225, 75, "Cancel", "White");

		// For each items in the player inventory
		var X = 1000;
		var Y = 125;
		for(var I = 0; I < DialogInventory.length; I++) {
			DrawRect(X, Y, 225, 275, ((MouseX >= X) && (MouseX < X + 225) && (MouseY >= Y) && (MouseY < Y + 275) && !CommonIsMobile) ? "cyan" : DialogInventory[I].Worn ? "pink" : "white");
			DrawImageResize("Assets/" + DialogInventory[I].Asset.Group.Family + "/" + DialogInventory[I].Asset.Group.Name + "/Preview/" + DialogInventory[I].Asset.Name + ".png", X + 2, Y + 2, 221, 221);
			DrawTextFit(DialogInventory[I].Asset.Description, X + 112, Y + 250, 221, "black");
			if (DialogInventory[I].Icon != "") DrawImage("Icons/" + DialogInventory[I].Icon + ".png", X + 2, Y + 110);
			X = X + 250;
			if (X > 1800) {
				X = 1000;
				Y = Y + 300;
			}
		}
	
	} else {

		// Can always cancel out
		var C = (Player.FocusGroup != null) ? Player : CurrentCharacter;
		DrawButton(1750, 25, 225, 75, "Cancel", "White");
	
		// If the player is progressing
		if (DialogProgress >= 0) {

			// Draw one or both items
			if ((DialogProgressPrevItem != null) && (DialogProgressNextItem != null)) {
				DrawItemPreview(1200, 250, DialogProgressPrevItem);
				DrawItemPreview(1575, 250, DialogProgressNextItem);
			} else DrawItemPreview(1387, 250, (DialogProgressPrevItem != null) ? DialogProgressPrevItem : DialogProgressNextItem);
		
			// Add or subtract to the automatic progression
			DialogProgress = DialogProgress + DialogProgressAuto;
			if (DialogProgress < 0) DialogProgress = 0;

			// Draw the current operation and progress
			DrawText(DialogProgressOperation, 1500, 650, "White", "Black");
			DrawProgressBar(1200, 700, 600, 100, DialogProgress);
			DrawText(DialogFind(Player, (CommonIsMobile) ? "ProgressClick" : "ProgressKeys"), 1500, 900, "White", "Black");

			// If the operation is completed
			if (DialogProgress >= 100) {

				// Add / swap / remove the item
				if (DialogProgressNextItem == null) InventoryRemove(C, C.FocusGroup.Name);
				else InventoryWear(C, DialogProgressNextItem.Asset.Name, DialogProgressNextItem.Asset.Group.Name);

				// The player can use another item right away, for another character we jump back to her reaction
				if (C.ID == 0) {
					if (DialogProgressNextItem == null) SkillProgress("Evasion", DialogProgressSkill);
					DialogInventoryBuild(C);
					DialogProgress = -1;
				} else {
					if (DialogProgressNextItem != null) SkillProgress("Bondage", DialogProgressSkill);
					C.CurrentDialog = DialogFind(C, ((DialogProgressNextItem == null) ? ("Remove" + DialogProgressPrevItem.Asset.Name) : DialogProgressNextItem.Asset.Name), ((DialogProgressNextItem == null) ? "Remove" : "") + C.FocusGroup.Name);
					DialogLeaveItemMenu();
				}

			}		

		} else {
			
			// If we must draw the struggle/unlock dialog
			var Item = InventoryGet(C, C.FocusGroup.Name);
			if (Item != null) {

				// Draw the item preview
				DrawItemPreview(1387, 250, Item);

				// Draw the struggle option
				if ((C.ID == 0) && (Item.Asset.Effect != null) && (Item.Asset.Effect.indexOf("Block") >= 0) && (Item.Asset.Effect.indexOf("Struggle") >= 0)) {
					DrawText(DialogFind(Player, "CanStruggle"), 1250, 62, "White", "Black");
					DrawButton(1500, 25, 225, 75, "Struggle", "White");
				}

				// Draw the unlock option
				if ((C.ID == 0) && (Item.Asset.Effect != null) && (Item.Asset.Effect.indexOf("Block") >= 0) && (Item.Asset.Effect.indexOf("Lock") >= 0)) {
					if (DialogCanUnlock(C)) {
						DrawText(DialogFind(Player, "CanUnlock"), 1250, 62, "White", "Black");
						DrawButton(1500, 25, 225, 75, "Unlock", "White");
					} else DrawText(DialogFind(Player, "CannotUnlock"), 1350, 62, "White", "Black");
				}

				// Draw the no struggle option
				if ((C.ID == 0) && (Item.Asset.Effect != null) && (Item.Asset.Effect.indexOf("Block") >= 0) && (Item.Asset.Effect.indexOf("Lock") < 0) && (Item.Asset.Effect.indexOf("Struggle") < 0))
					DrawText(DialogFind(Player, "CannotStruggle"), 1250, 62, "White", "Black");
			}

			// Show the no access text
			if (InventoryGroupIsBlocked(C)) DrawText(DialogFind(Player, "ZoneBlocked"), 1500, 700, "White", "Black");
			else DrawText(DialogFind(Player, "AccessBlocked"), 1500, 700, "White", "Black");
			
		}
		
	}

}

// Returns TRUE if the current dialog option is a full emote (all between parentheses)
function DialogFullEmote(D) {
	return ((D.indexOf("(") == 0) && (D.indexOf(")") == D.length - 1));
}	

// Garbles the speech if the character is gagged, anything between parentheses isn't touched
function DialogGarble(C, CD) {

	// Variables to build the new string and check if we are in a parentheses
	var NS = "";
	var Par = false;
	if (CD == null) CD = "";
		
	// Total gags always returns "..."
	if (C.Effect.indexOf("GagTotal") >= 0) {
		NS = "... ";
		for (var L = 0; L < CD.length; L++) {			
			var H = CD.charAt(L).toLowerCase();
			if (H == "(") Par = true;
			if (Par) NS = NS + CD.charAt(L);
			if (H == ")") Par = false;
		}
		return NS;
	}

	// Heavy garble - Almost no letter stays the same
	if (C.Effect.indexOf("GagHeavy") >= 0) {
		for (var L = 0; L < CD.length; L++) {
			var H = CD.charAt(L).toLowerCase();
			if (H == "(") Par = true;
			if (!Par) {
				if (H == "a" || H == "e" || H == "i" || H == "o" || H == "u" || H == "y" || H == "t") NS = NS + "e";
				if (H == "c" || H == "q" || H == "x") NS = NS + "k";
				if (H == "j" || H == "k" || H == "l" || H == "r" || H == "w") NS = NS + "a";
				if (H == "s" || H == "z" || H == "h") NS = NS + "h";
				if (H == "b" || H == "p" || H == "v") NS = NS + "f";
				if (H == "d" || H == "f" || H == "g" || H == "n" || H == "m") NS = NS + "m";
				if (H == " " || H == "!") NS = NS + H;
			} else NS = NS + CD.charAt(L);
			if (H == ")") Par = false;
		}
		return NS;
	}

	// Normal garble, keep vowels and a few letters the same
	if (C.Effect.indexOf("GagNormal") >= 0) {
		for (var L = 0; L < CD.length; L++) {
			var H = CD.charAt(L).toLowerCase();
			if (H == "(") Par = true;
			if (!Par) {
				if (H == "v" || H == "b" || H == "c" || H == "t") NS = NS + "e";
				if (H == "q" || H == "k" || H == "x") NS = NS + "k";
				if (H == "w" || H == "y" || H == "j" || H == "l" || H == "r") NS = NS + "a";
				if (H == "s" || H == "z") NS = NS + "h";
				if (H == "d" || H == "f") NS = NS + "m";
				if (H == "p") NS = NS + "f";
				if (H == "g") NS = NS + "n";
				if (H == " " || H == "!" || H == "." || H == "a" || H == "e" || H == "i" || H == "o" || H == "u" || H == "m" || H == "n" || H == "h") NS = NS + H;
			} else NS = NS + CD.charAt(L);
			if (H == ")") Par = false;
		}
		return NS;
	}
		
	// Light garble, half of the letters stay the same
	if (C.Effect.indexOf("GagLight") >= 0) {
		for (var L = 0; L < CD.length; L++) {
			var H = CD.charAt(L).toLowerCase();
			if (H == "(") Par = true;
			if (!Par) {
				if (H == "c" || H == "t") NS = NS + "e";
				if (H == "q" || H == "k" || H == "x") NS = NS + "k";
				if (H == "j" || H == "l" || H == "r") NS = NS + "a";
				if (H == "s") NS = NS + "z";
				if (H == "z") NS = NS + "s";
				if (H == "d" || H == "f" || H == "m" || H == "g") NS = NS + "m";
				if (H == "b" || H == "h" || H == "n" || H == "v" || H == "w" || H == "p" || H == " " || H == "'" || H == "?" || H == "!" || H == "." || H == "," || H == "a" || H == "e" || H == "i" || H == "o" || H == "u" || H == "y") NS = NS + H;
			} else NS = NS + CD.charAt(L);
			if (H == ")") Par = false;
		}
		return NS;
	}

	// No gag effect, we return the regular text
	return CD;

}

// Searches in the dialog for a specific stage keyword and returns that dialog option if we find it
function DialogFind(C, KeyWord1, KeyWord2) {
	for(var D = 0; D < C.Dialog.length; D++)
		if (C.Dialog[D].Stage == KeyWord1)
			return C.Dialog[D].Result;
	if (KeyWord2 != null)
		for(var D = 0; D < C.Dialog.length; D++)
			if (C.Dialog[D].Stage == KeyWord2)
				return C.Dialog[D].Result;
	return CurrentCharacter.CurrentDialog;
}

// Draw all the possible interactions 
function DialogDraw() {

	// Draw both the player and the interaction character
	if (CurrentCharacter.ID != 0) DrawCharacter(Player, 0, 0, 1);
	DrawCharacter(CurrentCharacter, 500, 0, 1);
	
	// If we must show the item menu
	if (((Player.FocusGroup != null) || ((CurrentCharacter.FocusGroup != null) && CurrentCharacter.AllowItem)) && (DialogIntro() != ""))
		DialogDrawItemMenu((Player.FocusGroup != null) ? Player : CurrentCharacter);
	else {

		// Draws the intro text or dialog result
		if ((DialogIntro() != "") && (DialogIntro() != "NOEXIT")) {
			DrawTextWrap(DialogGarble(CurrentCharacter, CurrentCharacter.CurrentDialog), 1025, -10, 840, 160, "white");
			DrawButton(1885, 25, 90, 90, "", "White", "Icons/Exit.png");
		} else DrawTextWrap(DialogGarble(CurrentCharacter, CurrentCharacter.CurrentDialog), 1025, -10, 950, 160, "white");

		// Draws the possible answers
		var pos = 0;
		for(var D = 0; D < CurrentCharacter.Dialog.length; D++)
			if ((CurrentCharacter.Dialog[D].Stage == CurrentCharacter.Stage) && (CurrentCharacter.Dialog[D].Option != null) && DialogPrerequisite(D)) {
				DrawTextWrap(DialogGarble(Player, CurrentCharacter.Dialog[D].Option), 1025, 160 + 105 * pos, 950, 80, "black", ((MouseX >= 1025) && (MouseX <= 1975) && (MouseY >= 160 + pos * 105) && (MouseY <= 240 + pos * 105) && !CommonIsMobile) ? "cyan" : "white");
				pos++;
			}

		// The more time you spend with an NPC, the more the love will rise
		NPCInteraction();

	}

}