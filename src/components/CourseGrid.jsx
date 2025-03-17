import React from 'react'
import programming from "../../public/images/bprogrammer.svg"
import business from "../../public/images/interview.svg"
import finance from "../../public/images/savings.svg"
import digital from "../../public/images/social-thinking.svg"
import { Link } from 'react-router-dom'

const CourseGrid = ({ onCategorySelect }) => {
  // Unique categories with their images and search keywords
  const categories = [
    {
      name: "Programming",
      image: programming,
      keywords: "programming coding development software tutorial"
    },
    {
      name: "Business & Management",
      image: business,
      keywords: "business management entrepreneurship leadership"
    },
    {
      name: "Finance & Investment",
      image: finance,
      keywords: "finance investment stock market trading"
    },
    {
      name: "Digital Marketing",
      image: digital,
      keywords: "digital marketing social media SEO advertising"
    }
  ];

  const handleCategoryClick = (category) => {
    if (onCategorySelect) {
      onCategorySelect(category.keywords);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-200">Popular Categories</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((category, index) => (
          <div
            key={index}
            onClick={() => handleCategoryClick(category)}
            className="bg-gray-800 rounded-lg p-4 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:bg-gray-700"
          >
            <div className="flex flex-col items-center">
              <img
                src={category.image}
                alt={category.name}
                className="w-16 h-16 mb-3"
              />
              <h3 className="text-center text-sm font-medium text-gray-200">
                {category.name}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CourseGrid

function Card({ image, title }) {
  return (
    <Link to={`/hero/${title}`}>
      <div className=' w-[140px] h-[190px] p-3 flex flex-col gap-y-4 rounded-md border-slate-400 border'>
        <img id={chrome.runtime.getURL(image)} src={chrome.runtime.getURL(image)} alt='' className='h-[160px] object-cover rounded-2xl' />
        <p className=' text-md font-medium'>{title}</p>
      </div>
    </Link>
  )
}
