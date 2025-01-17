import React from "react";
import "react-vertical-timeline-component/style.min.css";
import { education, proexp } from "../constants";
import { SectionWrapper } from "../hoc";

const TimelineItem = ({ item }) => (
  <div className="mb-6">

    <div className="absolute -left-[0.56rem] w-4 h-4 bg-purple-500 rounded-full border-2 border-purple-500"></div>

    <p className="text-sm text-gray-400">{item.date}</p>

    <h3 className="text-lg font-semibold">
      {item.titleLink ? (
        <a
          href={item.titleLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-300 hover:text-purple-500"
        >
          {item.title}
        </a>
      ) : (
        item.title
      )}
    </h3>

    {/* Company Name with optional link */}
    {item.company_name && (
      <p className="text-sm text-gray-400">
        {item.companyLink ? (
          <a
            href={item.companyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-purple-500"
          >
            {item.company_name}
          </a>
        ) : (
          item.company_name
        )}
      </p>
    )}

    {/* Bullet Points */}
    {item.points?.length > 0 && (
      <div className="text-sm text-secondary mt-2 space-y-2">
        {item.points.map((point, idx) => (
          <div key={idx} className="flex items-start">
            <span className="mr-2 text-[14px] text-secondary">•</span>
            <span className="mr-2 text-[14px] text-secondary"> {point.text}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Container for a timeline section
const TimelineSection = ({ items, sectionTitle }) => (
  <div className="mb-8">
    <h2 className="text-4xl font-bold mb-4">{sectionTitle}</h2>
    <div className="relative border-l-2 border-purple-500 pl-6">
      {items.map((item, index) => (
        <TimelineItem key={index} item={item} />
      ))}
    </div>
  </div>
);

const Timeline = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    <TimelineSection items={education} sectionTitle="Education" />
    <TimelineSection items={proexp} sectionTitle="Experience" />
  </div>
);

export default SectionWrapper(Timeline, "work");



