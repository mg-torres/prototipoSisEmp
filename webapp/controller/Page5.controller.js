sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./ActionSheet4", "./ActionSheet6", "./ActionSheet5",
	"./utilities",
	"sap/ui/core/routing/History"
], function(BaseController, MessageBox, ActionSheet4, ActionSheet6, ActionSheet5, Utilities, History) {
	"use strict";

	return BaseController.extend("com.sap.build.standard.sistemaDeArchivos.controller.Page5", {
		handleRouteMatched: function(oEvent) {
			var sAppId = "App6197aecfc5c52d01ba7d6426";

			var oParams = {};

			if (oEvent.mParameters.data.context) {
				this.sContext = oEvent.mParameters.data.context;

			} else {
				if (this.getOwnerComponent().getComponentData()) {
					var patternConvert = function(oParam) {
						if (Object.keys(oParam).length !== 0) {
							for (var prop in oParam) {
								if (prop !== "sourcePrototype" && prop.includes("Set")) {
									return prop + "(" + oParam[prop][0] + ")";
								}
							}
						}
					};

					this.sContext = patternConvert(this.getOwnerComponent().getComponentData().startupParameters);

				}
			}

			var oPath;

			if (this.sContext) {
				oPath = {
					path: "/" + this.sContext,
					parameters: oParams
				};
				this.getView().bindObject(oPath);
			}

		},
		_onImagePress: function(oEvent) {

			var oBindingContext = oEvent.getSource().getBindingContext();

			return new Promise(function(fnResolve) {

				this.doNavigate("Page1", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		doNavigate: function(sRouteName, oBindingContext, fnPromiseResolve, sViaRelation) {
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oModel = (oBindingContext) ? oBindingContext.getModel() : null;

			var sEntityNameSet;
			if (sPath !== null && sPath !== "") {
				if (sPath.substring(0, 1) === "/") {
					sPath = sPath.substring(1);
				}
				sEntityNameSet = sPath.split("(")[0];
			}
			var sNavigationPropertyName;
			var sMasterContext = this.sMasterContext ? this.sMasterContext : sPath;

			if (sEntityNameSet !== null) {
				sNavigationPropertyName = sViaRelation || this.getOwnerComponent().getNavigationPropertyForNavigationWithContext(sEntityNameSet, sRouteName);
			}
			if (sNavigationPropertyName !== null && sNavigationPropertyName !== undefined) {
				if (sNavigationPropertyName === "") {
					this.oRouter.navTo(sRouteName, {
						context: sPath,
						masterContext: sMasterContext
					}, false);
				} else {
					oModel.createBindingContext(sNavigationPropertyName, oBindingContext, null, function(bindingContext) {
						if (bindingContext) {
							sPath = bindingContext.getPath();
							if (sPath.substring(0, 1) === "/") {
								sPath = sPath.substring(1);
							}
						} else {
							sPath = "undefined";
						}

						// If the navigation is a 1-n, sPath would be "undefined" as this is not supported in Build
						if (sPath === "undefined") {
							this.oRouter.navTo(sRouteName);
						} else {
							this.oRouter.navTo(sRouteName, {
								context: sPath,
								masterContext: sMasterContext
							}, false);
						}
					}.bind(this));
				}
			} else {
				this.oRouter.navTo(sRouteName);
			}

			if (typeof fnPromiseResolve === "function") {
				fnPromiseResolve();
			}

		},
		_onImagePress1: function(oEvent) {

			var oBindingContext = oEvent.getSource().getBindingContext();

			return new Promise(function(fnResolve) {

				this.doNavigate("Page1", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onIconPress: function(oEvent) {

			var sActionsheetName = "ActionSheet5";
			this.mActionsheets = this.mActionsheets || {};
			var oActionsheet = this.mActionsheets[sActionsheetName];

			if (!oActionsheet) {
				oActionsheet = new ActionSheet5(this.getView());
				this.mActionsheets[sActionsheetName] = oActionsheet;

				oActionsheet.getControl().setPlacement("Bottom");

				// For navigation.
				oActionsheet.setRouter(this.oRouter);
			}

			var oSource = oEvent.getSource();

			oActionsheet.open(oSource);

		},
		_onIconPress1: function(oEvent) {

			var sActionsheetName = "ActionSheet6";
			this.mActionsheets = this.mActionsheets || {};
			var oActionsheet = this.mActionsheets[sActionsheetName];

			if (!oActionsheet) {
				oActionsheet = new ActionSheet6(this.getView());
				this.mActionsheets[sActionsheetName] = oActionsheet;

				oActionsheet.getControl().setPlacement("Bottom");

				// For navigation.
				oActionsheet.setRouter(this.oRouter);
			}

			var oSource = oEvent.getSource();

			oActionsheet.open(oSource);

		},
		avatarInitialsFormatter: function(sTextValue) {
			return typeof sTextValue === 'string' ? sTextValue.substr(0, 2) : undefined;

		},
		_onAvatarPress: function(oEvent) {

			var oBindingContext = oEvent.getSource().getBindingContext();

			return new Promise(function(fnResolve) {

				this.doNavigate("Page4", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onButtonPress: function(oEvent) {

			var sActionsheetName = "ActionSheet4";
			this.mActionsheets = this.mActionsheets || {};
			var oActionsheet = this.mActionsheets[sActionsheetName];

			if (!oActionsheet) {
				oActionsheet = new ActionSheet4(this.getView());
				this.mActionsheets[sActionsheetName] = oActionsheet;

				oActionsheet.getControl().setPlacement("Bottom");

				// For navigation.
				oActionsheet.setRouter(this.oRouter);
			}

			var oSource = oEvent.getSource();

			oActionsheet.open(oSource);

		},
		_onIconPress2: function(oEvent) {

			var oBindingContext = oEvent.getSource().getBindingContext();

			return new Promise(function(fnResolve) {

				this.doNavigate("Page2", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		onInit: function() {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("Page5").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

		}
	});
}, /* bExport= */ true);
