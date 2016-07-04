import d3 from 'd3';

export function moveToFront() {
  return d3.select(this).each(function () {
    this.parentNode.appendChild(this);
  });
}
