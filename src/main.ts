import { App, Editor, MarkdownView, Modal, Notice, Plugin } from "obsidian";
import type { LythicSettings } from "./settings";

interface LythicPluginSettings extends LythicSettings {
  onboardingComplete: boolean;
}

const DEFAULT_SETTINGS: LythicPluginSettings = {
  onboardingComplete: false,
  vaultIntelligenceEnabled: true,
  graphEnhancementEnabled: true,
};

export default class LythicPlugin extends Plugin {
  settings!: LythicPluginSettings;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addRibbonIcon("brain", "Lythic", () => {
      new Notice("Lythic activated");
    });

    this.addCommand({
      id: "lythic-open-graph",
      name: "Open Lythic Graph",
      callback: () => this.openLythicGraph(),
    });

    this.addCommand({
      id: "lythic-index-vault",
      name: "Index vault with Lythic",
      callback: () => this.indexVault(),
    });

    this.addSettingTab(new LythicSettingTab(this.app, this));

    console.log("Lythic loaded");
  }

  onunload(): void {
    console.log("Lythic unloaded");
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<LythicPluginSettings>);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private openLythicGraph(): void {
    new LythicGraphModal(this.app).open();
  }

  private async indexVault(): Promise<void> {
    new Notice("Lythic: indexing vault…");
    // TODO: implement vault intelligence (embeddings, link inference) via @backend-specialist pipeline
  }
}

class LythicGraphModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Lythic Graph" });
    contentEl.createEl("p", { text: "Enhanced graph view coming soon — powered by Lythic vault intelligence." });
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}

class LythicSettingTab extends PluginSettingTab {
  plugin: LythicPlugin;

  constructor(app: App, plugin: LythicPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Lythic Settings" });
  }
}

// Re-export for OpenCode agents
export type { LythicPluginSettings };
