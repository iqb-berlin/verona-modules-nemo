import { Component, computed, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'stars-standard-icon',
  standalone: true,
  templateUrl: './standard-icon.component.html'
})
export class StandardIconComponent {
  readonly icon = input<string>();
  readonly selected = input<boolean>(false);

  // computed SafeHtml used by the template
  readonly svgHtml = computed<SafeHtml>(() => {
    const raw = this.icon?.() ?? '';
    const iconKey = raw.toString().trim();

    // if icon is empty/only whitespace, return empty html immediately
    if (!iconKey) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }

    const html = this.renderIconHtml(iconKey, !!this.selected?.());
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  constructor(private sanitizer: DomSanitizer) {}

  // eslint-disable-next-line class-methods-use-this
  private renderIconHtml(iconKey: string, selected: boolean): string {
    console.log(`Rendering icon for key: ${iconKey}, selected: ${selected}`);
    switch (iconKey) {
      case 'CHECK_GREEN': {
        return `
          <svg class="accept-icon" width="92" height="78" viewBox="0 0 92 78" fill="none" xmlns="http://www.w3.org/2000/svg" data-cy="button-with-icon">
            <path d="M8 45.2L30.2007 69.1756C30.6071 69.6146 31.3055 69.6008 31.6943 69.1462L84 8" stroke="#4A7611" stroke-width="16" stroke-linecap="round"/>
          </svg>`;
      }
      case 'CLOSE_RED': {
        return `
          <svg class="reject-icon" width="84" height="85" viewBox="0 0 84 85" fill="none" xmlns="http://www.w3.org/2000/svg" data-cy="button-with-icon">
            <path d="M8 10.1006L76 75.8713" stroke="#B83A1E" stroke-width="16" stroke-linecap="round"/>
            <path d="M74.8853 8.98535L9.11451 76.9854" stroke="#B83A1E" stroke-width="16" stroke-linecap="round"/>
          </svg>`;
      }
      case 'CLAP_HANDS': {
        return '<img src="assets/images/hands/clapping-hand.png" alt="Clapping hands" class="clap-hands" style="width:100px;height:100px;max-width:100%;object-fit:contain;display:block;" data-cy="button-with-icon" />';
      }
      case 'SMILEY_1': {
        if (selected) {
          return `
            <svg width="124" height="124"  viewBox="0 0 124 124" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="61.676" cy="61.676" r="61.676" fill="#0050E5"/>
              <path d="M87.5776 41.0195L81.5161 47.0811L87.5776 53.1426L84.1802 56.54L78.1187 50.4785L78.1021 50.4951L74.7046 47.0977L74.7212 47.0811L74.7046 47.0645L78.1021 43.667L78.1187 43.6836L84.1802 37.6221L87.5776 41.0195Z" fill="white"/>
              <path d="M35.7703 53.1426L41.8328 47.0801L35.7722 41.0195L39.1697 37.6221L45.2302 43.6826L45.2459 43.667L48.6433 47.0645L48.6277 47.0801L48.6453 47.0977L45.2478 50.4951L45.2302 50.4775L39.1677 56.54L35.7703 53.1426Z" fill="white"/>
              <path d="M37.5867 87.7486C38.0526 81.5987 43.4995 69.2991 61.5595 69.2991C79.6195 69.2991 85.2206 81.5987 85.7636 87.7486" stroke="white" stroke-width="6.57877" stroke-linecap="round"/>
            </svg>`;
        }
        return `
          <svg width="130" height="130" viewBox="0 0 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#filter0_d_1033_187)">
              <circle cx="61.676" cy="61.676" r="61.676" fill="white"/>
            </g>
            <path d="M87.5776 41.0195L81.5161 47.0811L87.5776 53.1426L84.1802 56.54L78.1187 50.4785L78.1021 50.4951L74.7046 47.0977L74.7212 47.0811L74.7046 47.0645L78.1021 43.667L78.1187 43.6836L84.1802 37.6221L87.5776 41.0195Z" fill="#0050E5"/>
            <path d="M35.7703 53.1426L41.8328 47.0801L35.7722 41.0195L39.1697 37.6221L45.2302 43.6826L45.2459 43.667L48.6433 47.0645L48.6277 47.0801L48.6453 47.0977L45.2478 50.4951L45.2302 50.4775L39.1677 56.54L35.7703 53.1426Z" fill="#0050E5"/>
            <path d="M37.5867 87.7486C38.0526 81.5987 43.4995 69.2991 61.5595 69.2991C79.6195 69.2991 85.2206 81.5987 85.7636 87.7486" stroke="#0050E5" stroke-width="6.57877" stroke-linecap="round"/>
          </svg>`;
      }
      case 'SMILEY_2': {
        if (selected) {
          return `
            <svg width="124" height="124" viewBox="0 0 124 124" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="61.676" cy="61.676" r="61.676" fill="#0050E5"/>
              <circle cx="80.4623" cy="47.0811" r="4.11173" fill="white"/>
              <circle cx="42.8896" cy="47.0811" r="4.11173" fill="white"/>
              <path d="M49.8647 85.7192C50.0932 82.4075 52.7638 75.7841 61.6184 75.7841C70.4731 75.7841 73.2193 82.4075 73.4855 85.7192" stroke="white" stroke-width="6.57877" stroke-linecap="round"/>
            </svg>`;
        }
        return `
          <svg width="130" height="130" viewBox="0 0 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#filter0_d_1033_244)">
              <circle cx="61.676" cy="61.676" r="61.676" fill="white"/>
            </g>
            <circle cx="80.4623" cy="47.0811" r="4.11173" fill="#0050E5"/>
            <circle cx="42.8896" cy="47.0811" r="4.11173" fill="#0050E5"/>
            <path d="M49.8647 85.7192C50.0932 82.4075 52.7638 75.7841 61.6184 75.7841C70.4731 75.7841 73.2193 82.4075 73.4855 85.7192" stroke="#0050E5" stroke-width="6.57877" stroke-linecap="round"/>
          </svg>`;
      }
      case 'SMILEY_3': {
        if (selected) {
          return `
            <svg width="124" height="124" viewBox="0 0 124 124" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="61.676" cy="61.676" r="61.676" fill="#0050E5"/>
              <path d="M42.8914 84.7397H80.4631" stroke="white" stroke-width="6.57877" stroke-linecap="round"/>
              <circle cx="80.4631" cy="47.0811" r="4.11173" fill="white"/>
              <circle cx="42.8903" cy="47.0811" r="4.11173" fill="white"/>
            </svg>`;
        }
        return `
          <svg width="130" height="130" viewBox="0 0 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#filter0_d_1033_234)">
              <circle cx="61.676" cy="61.676" r="61.676" fill="white"/>
            </g>
            <path d="M42.8914 84.7397H80.4631" stroke="#0050E5" stroke-width="6.57877" stroke-linecap="round"/>
            <circle cx="80.4631" cy="47.0811" r="4.11173" fill="#0050E5"/>
            <circle cx="42.8903" cy="47.0811" r="4.11173" fill="#0050E5"/>
          </svg>`;
      }
      case 'SMILEY_4': {
        if (selected) {
          return `
            <svg width="124" height="124" viewBox="0 0 124 124" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="61.676" cy="61.676" r="61.676" fill="#0050E5"/>
              <path d="M85.7664 73.6349C85.3004 79.7847 79.8535 92.0844 61.7935 92.0843C43.7336 92.0843 38.1325 79.7847 37.5894 73.6349" stroke="white" stroke-width="6.57877" stroke-linecap="round"/>
              <circle cx="80.4639" cy="47.9034" r="4.93408" fill="white"/>
              <circle cx="42.8911" cy="47.9034" r="4.93408" fill="white"/>
            </svg>`;
        }
        return `
          <svg width="130" height="130" viewBox="0 0 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#filter0_d_1033_208)">
              <circle cx="61.676" cy="61.676" r="61.676" fill="white"/>
            </g>
            <path d="M85.7664 73.6349C85.3004 79.7847 79.8535 92.0844 61.7935 92.0843C43.7336 92.0843 38.1325 79.7847 37.5894 73.6349" stroke="#0050E5" stroke-width="6.57877" stroke-linecap="round"/>
            <circle cx="80.4639" cy="47.9034" r="4.93408" fill="#0050E5"/>
            <circle cx="42.8911" cy="47.9034" r="4.93408" fill="#0050E5"/>
          </svg>`;
      }
      case 'SMILEY_5': {
        if (selected) {
          return `
            <svg width="124" height="124" viewBox="0 0 124 124" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="61.676" cy="61.676" r="61.676" fill="#0050E5"/>
              <circle cx="83.5944" cy="47.2991" r="6.57877" fill="white"/>
              <circle cx="39.7607" cy="47.2991" r="6.57877" fill="white"/>
              <path d="M61.7928 93.9645C78.2636 93.9645 84.2434 83.7342 85.5217 77.2688C85.7074 76.3296 84.9489 75.515 83.9916 75.515L39.385 75.515C38.4196 75.515 37.6589 76.3432 37.8586 77.2878C39.2259 83.7542 45.3382 93.9645 61.7928 93.9645Z" stroke="white" stroke-width="6.57877"/>
            </svg>`;
        }
        return `
          <svg width="130" height="130" viewBox="0 0 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#filter0_d_1033_220)">
              <circle cx="61.676" cy="61.676" r="61.676" fill="white"/>
            </g>
            <circle cx="83.5944" cy="47.2991" r="6.57877" fill="#0050E5"/>
            <circle cx="39.7607" cy="47.2991" r="6.57877" fill="#0050E5"/>
            <path d="M61.7928 93.9645C78.2636 93.9645 84.2434 83.7342 85.5217 77.2688C85.7074 76.3296 84.9489 75.515 83.9916 75.515L39.385 75.515C38.4196 75.515 37.6589 76.3432 37.8586 77.2878C39.2259 83.7542 45.3382 93.9645 61.7928 93.9645Z" stroke="#0050E5" stroke-width="6.57877"/>
          </svg>`;
      }
      case 'ONES': {
        if (selected) {
          return `
            <svg width="58" height="58" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
               <g filter="url(#filter0_dd_1047_1079)">
                 <rect width="50" height="50" rx="16" fill="#DCDCDC"/>
               </g>
               <circle cx="25" cy="25" r="15" fill="#0050E5"/>
            </svg>`;
        }
        return `
          <svg width="58" height="58" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#filter0_d_1047_1063)">
              <rect width="50" height="50" rx="16" fill="white"/>
              <rect x="0.5" y="0.5" width="49" height="49" rx="15.5" stroke="#DBDDE7"/>
            </g>
            <circle cx="25" cy="25" r="15" fill="#0050E5"/>
          </svg>`;
      }
      case 'TENS': {
        if (selected) {
          return `
            <svg width="652" height="58" viewBox="0 0 652 58" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g filter="url(#filter0_dd_1047_1082)">
                <rect width="644" height="50" rx="16" fill="#DCDCDC"/>
              </g>
              <circle cx="24.5156" cy="25" r="15" fill="#0050E5"/>
              <circle cx="355" cy="25" r="15" fill="#0050E5"/>
              <circle cx="91" cy="25" r="15" fill="#0050E5"/>
              <circle cx="421" cy="25" r="15" fill="#0050E5"/>
              <circle cx="157" cy="25" r="15" fill="#0050E5"/>
              <circle cx="487" cy="25" r="15" fill="#0050E5"/>
              <circle cx="223" cy="25" r="15" fill="#0050E5"/>
              <circle cx="553" cy="25" r="15" fill="#0050E5"/>
              <circle cx="289" cy="25" r="15" fill="#0050E5"/>
              <circle cx="619" cy="25" r="15" fill="#0050E5"/>
            </svg>`;
        }
        return `
          <svg width="652" height="58" viewBox="0 0 652 58" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#filter0_d_1047_978)">
              <rect width="644" height="50" rx="16" fill="white"/>
              <rect x="0.5" y="0.5" width="643" height="49" rx="15.5" stroke="#DBDDE7"/>
            </g>
            <circle cx="24.5146" cy="25" r="15" fill="#0050E5"/>
            <circle cx="354.999" cy="25" r="15" fill="#0050E5"/>
            <circle cx="90.999" cy="25" r="15" fill="#0050E5"/>
            <circle cx="420.999" cy="25" r="15" fill="#0050E5"/>
            <circle cx="156.999" cy="25" r="15" fill="#0050E5"/>
            <circle cx="486.999" cy="25" r="15" fill="#0050E5"/>
            <circle cx="222.999" cy="25" r="15" fill="#0050E5"/>
            <circle cx="552.999" cy="25" r="15" fill="#0050E5"/>
            <circle cx="288.999" cy="25" r="15" fill="#0050E5"/>
            <circle cx="618.999" cy="25" r="15" fill="#0050E5"/>
           </svg>`;
      }
      default:
        return '';
    }
  }
}
