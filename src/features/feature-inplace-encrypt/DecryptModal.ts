import { App, Component, Modal, Notice, Setting, TextAreaComponent, MarkdownRenderer } from 'obsidian';

export default class DecryptModal extends Modal {
	text: string;
	decryptInPlace = false;
	save = false;
	
	canDecryptInPlace = true;
	isPreviewMode = true; // Show preview by default
	private cTextArea: TextAreaComponent | undefined;

	constructor(
		app: App,
		title: string,
		text = ''
	) {
		super(app);
		this.titleEl.setText(title);
		this.text = text;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.empty();
		contentEl.classList.add('meld-encrypt-decrypt-modal');

		// Create a toggle for preview/edit mode
		const modeToggleSetting = new Setting(contentEl)
			.setName('Display Mode')
			.addToggle(toggle => {
				toggle
					.setValue(this.isPreviewMode)
					.onChange(value => {
						this.isPreviewMode = value;
						this.refreshContent(contentEl);
					});
				toggle.toggleEl.setAttribute('aria-label', 'Toggle between preview and edit mode');
			});
		modeToggleSetting.nameEl.style.marginBottom = '0.5em';

		// Container for preview or edit content
		const contentContainer = document.createElement('div');
		contentContainer.style.marginTop = '1em';
		contentEl.appendChild(contentContainer);

		this.refreshContent(contentEl, contentContainer);

		const sActions = new Setting(contentEl);

		sActions
			.addButton(cb => {
				cb
					.setButtonText('Save')
					.onClick( evt =>{
						this.save = true;
						if (this.cTextArea) {
							this.text = this.cTextArea.getValue();
						}
						this.close();
					});
			});

		sActions
			.addButton( cb =>{
				cb
					.setButtonText('Copy')
					.onClick( evt =>{
						navigator.clipboard.writeText( this.text );
						new Notice('Copied!');
					})
				;
			})
		;
		if (this.canDecryptInPlace){
			sActions.addButton( cb =>{
				cb.setWarning()
				.setButtonText('Decrypt in-place')
				.onClick( evt =>{
					this.decryptInPlace = true;
					if (this.cTextArea) {
						this.text = this.cTextArea.getValue();
					}
					this.close();
				});
			});
		}
	}

	private refreshContent(contentEl: HTMLElement, contentContainer?: HTMLElement) {
		// Find or create the content container
		if (!contentContainer) {
			contentContainer = contentEl.querySelector('.meld-decrypt-content-container') as HTMLElement;
			if (!contentContainer) {
				contentContainer = document.createElement('div');
				contentContainer.classList.add('meld-decrypt-content-container');
				contentEl.appendChild(contentContainer);
			}
		}

		contentContainer.empty();

		if (this.isPreviewMode) {
			// Render markdown preview
			const previewContainer = document.createElement('div');
			previewContainer.classList.add('markdown-preview-view');
			previewContainer.style.maxHeight = '400px';
			previewContainer.style.overflowY = 'auto';
			previewContainer.style.border = '1px solid var(--background-modifier-border)';
			previewContainer.style.borderRadius = '4px';
			previewContainer.style.padding = '8px';
			contentContainer.appendChild(previewContainer);

			// Use MarkdownRenderer to render the markdown content
			const mdComponent = new Component();
			MarkdownRenderer.renderMarkdown(this.text, previewContainer, '', mdComponent);
		} else {
			// Show edit mode with textarea
			const setting = new Setting(contentContainer);
			setting.addTextArea(cb => {
				this.cTextArea = cb;
				cb.setValue(this.text);
				cb.inputEl.setSelectionRange(0, 0);
				cb.inputEl.rows = 10;
				cb.inputEl.focus();
				cb.onChange(value => {
					this.text = value;
				});
			});
			setting.settingEl.querySelector('.setting-item-info')?.remove();
		}
	}

}